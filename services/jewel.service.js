import { dbService } from './db.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'jewelry'

export const jewelService = {
  query,
  get,
  remove,
  save,
  decreaseQuantity // ✅ הוספנו כאן
}

// **שליפת כל התכשיטים עם אפשרות לסינון**
async function query(filterBy = {}) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const criteria = {}

  if (filterBy.txt) {
    criteria.vendor = { $regex: filterBy.txt, $options: 'i' }
  }

  if (filterBy.maxPrice) {
    criteria.price = { $lte: +filterBy.maxPrice }
  }

  if (filterBy.designed) {
    criteria.designed = filterBy.designed
  }

  return await collection.find(criteria).toArray()
}

// **שליפת תכשיט לפי ID**
async function get(jewelId) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  return await collection.findOne({ _id: new ObjectId(jewelId) })
}

// **מחיקת תכשיט לפי ID**
async function remove(jewelId, loggedinUser) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const jewel = await collection.findOne({ _id: new ObjectId(jewelId) })

  if (!jewel) throw new Error('No such jewel')
  if (jewel.owner._id.toString() !== loggedinUser._id.toString()) {
    throw new Error('Not your jewel')
  }

  await collection.deleteOne({ _id: new ObjectId(jewelId) })
  return 'Jewel successfully deleted'
}

// **הוספה או עדכון תכשיט**
async function save(jewel, loggedinUser) {
  const collection = await dbService.getCollection(COLLECTION_NAME)

  if (jewel._id) {
    // **עדכון**
    const jewelToUpdate = {
      vendor: jewel.vendor,
      speed: jewel.speed,
      price: jewel.price,
      fakeprice: jewel.fakeprice,
      quantity: jewel.quantity,
      img: jewel.img,
      imghover: jewel.imghover,
      imgthird: jewel.imgthird,
      isSoldOut: jewel.isSoldOut,
      designed: jewel.designed,
      descriptionENG: jewel.descriptionENG,
      descriptionHEB: jewel.descriptionHEB
    }

    await collection.updateOne(
      { _id: new ObjectId(jewel._id) },
      { $set: jewelToUpdate }
    )
    return jewel
  } else {
    // **הוספה**
    jewel.owner = loggedinUser
    const result = await collection.insertOne(jewel)
    jewel._id = result.insertedId.toString()
    return jewel
  }
}

// ✅ הורדת כמות מוצר לאחר רכישה
async function decreaseQuantity(jewelId, amount = 1) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const jewel = await collection.findOne({ _id: new ObjectId(jewelId) })
  if (!jewel) throw new Error("Jewel not found")

  const newQuantity = Math.max(0, (jewel.quantity || 0) - amount)

  await collection.updateOne(
    { _id: new ObjectId(jewelId) },
    {
      $set: {
        quantity: newQuantity,
        isSoldOut: newQuantity === 0
      }
    }
  )

  return { ...jewel, quantity: newQuantity, isSoldOut: newQuantity === 0 }
}