async function trimVersions(versions, noteId, ownerId) {
  const oldVersions = await versions.find({ noteId, ownerId }).sort({ createdAt: -1 }).skip(10).project({ _id: 1 }).toArray();
  if (oldVersions.length) await versions.deleteMany({ _id: { $in: oldVersions.map((version) => version._id) } });
}

async function saveVersion(versions, note, ownerId) {
  await versions.insertOne({ noteId: note._id, ownerId, title: note.title, body: note.body, createdAt: new Date() });
  await trimVersions(versions, note._id, ownerId);
}

module.exports = { saveVersion, trimVersions };
