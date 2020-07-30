import fs from 'fs';

export default async (name, data) => {
  const path = '/tmp/files_manager/';
  const clear = Buffer.from(data, 'base64').toString('utf8');
  fs.promises.mkdir(path, { recursive: true }).catch((err) => { throw err; });
  fs.writeFile(path + name, clear, { flag: 'w' }, (err) => {
    if (err) throw err;
  });

  return path;
};
