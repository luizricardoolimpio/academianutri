import { IDBFactory } from 'fake-indexeddb';
import { closeDb } from '../src/storage/db';

/** Banco novo e vazio para cada teste. */
export function freshDb() {
  closeDb();
  globalThis.indexedDB = new IDBFactory();
}
