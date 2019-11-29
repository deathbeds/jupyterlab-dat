import React from 'react';
import { dat } from '@deathbeds/dat-sdk-webpack';

export function renderInfoTable(info: dat.IDatArchive.IArchiveInfo) {
  if (info == null) {
    return <blockquote>No metadata yet</blockquote>;
  }

  let author = '';

  if (info.author) {
    if (typeof info.author === 'string') {
      author = info.author;
    } else if (info.author.name) {
      author = info.author.name;
    }
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Version</th>
          <th>Peers</th>
          <th>Title</th>
          <th>Description</th>
          <th>Author</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{info.version || 0}</td>
          <td>{info.peers || 0}</td>
          <td>{info.title || ''}</td>
          <td>{info.description || ''}</td>
          <td>{author}</td>
        </tr>
      </tbody>
    </table>
  );
}
