import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/preact';
afterEach(() => { cleanup(); location.hash = ''; });
