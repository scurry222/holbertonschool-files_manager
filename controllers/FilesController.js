import { ObjectID } from 'mongodb';
import { v4 as uuid } from 'uuid';

import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import writeFile from '../utils/write';

export default async (req, res) => {
  const token = req.header('X-Token');
  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, type, data } = req.body;
  let { parentId, isPublic } = req.body;

  if (!parentId) parentId = 0;
  if (!isPublic) isPublic = false;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  const fileTypes = ['folder', 'file', 'image'];

  if (!type || !fileTypes.includes(type)) {
    return res.status(400).json({ error: 'Missing type' });
  }
  if (!data && type !== 'folder') {
    return res.status(400).json({ error: 'Missing Data' });
  }
  if (parentId) {
    const parent = await dbClient.findFile({ _id: ObjectID(parentId) });

    if (!parent) return res.status(400).json({ error: 'Parent not found' });

    if (parent.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }
  }
  const fileData = {
    userId,
    name,
    type,
    parentId,
    isPublic,
  };

  if (type === 'folder') {
    const newFile = await dbClient.uploadFile(fileData);
    newFile.id = newFile._id;
    delete newFile._id;

    return res.json(newFile);
  }

  fileData.id = userId;
  fileData.data = data;
  fileData.path = writeFile(uuid(), data);

  delete fileData.path;
  delete fileData.data;

  return res.json(fileData);
};
