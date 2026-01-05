import { dbService } from './db.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'jewelry'

export const jewelService = {
  query,
  get,
  remove,
  save,
  decreaseQuantity
}

// --------------------------------------------------
// 📜 שליפת כל התכשיטים עם אפשרות סינון
// --------------------------------------------------
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
  if (filterBy.type) {
    criteria.type = filterBy.type
  }

  return await collection.find(criteria).toArray()
}

// --------------------------------------------------
// 🔍 שליפת תכשיט לפי ID
// --------------------------------------------------
async function get(jewelId) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  return await collection.findOne({ _id: new ObjectId(jewelId) })
}

// --------------------------------------------------
// ❌ מחיקת תכשיט לפי ID (ללא בדיקת בעלות)
// --------------------------------------------------
async function remove(jewelId) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const jewel = await collection.findOne({ _id: new ObjectId(jewelId) })

  if (!jewel) throw new Error('No such jewel')

  await collection.deleteOne({ _id: new ObjectId(jewelId) })
  console.log(`✅ Jewel ${jewelId} deleted successfully`)
  return 'Jewel successfully deleted'
}

// --------------------------------------------------
// 💾 שמירת תכשיט (הוספה או עדכון) — ללא Owner
// --------------------------------------------------
async function save(jewel) {
  const collection = await dbService.getCollection(COLLECTION_NAME)

  if (jewel._id) {
    // ✏️ עדכון קיים
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
      type: jewel.type,
      designed: jewel.designed,
      descriptionENG: jewel.descriptionENG,
      descriptionHEB: jewel.descriptionHEB
    }

    await collection.updateOne(
      { _id: new ObjectId(jewel._id) },
      { $set: jewelToUpdate }
    )
    console.log(`🟡 Jewel ${jewel._id} updated successfully`)
    return jewel
  } else {
    // 🆕 הוספה חדשה
    const result = await collection.insertOne(jewel)
    jewel._id = result.insertedId.toString()
    console.log(`🟢 New jewel added with ID: ${jewel._id}`)
    return jewel
  }
}

// --------------------------------------------------
// 📉 הורדת כמות מוצר לאחר רכישה
// --------------------------------------------------
async function decreaseQuantity(jewelId, amount = 1) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const jewel = await collection.findOne({ _id: new ObjectId(jewelId) })
  if (!jewel) throw new Error('Jewel not found')

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

  console.log(`📦 Quantity updated for jewel ${jewelId}: ${newQuantity}`)
  return { ...jewel, quantity: newQuantity, isSoldOut: newQuantity === 0 }
}