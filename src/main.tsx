import { render } from 'preact';
import { App } from './app';
import './styles.css';

if (!location.hash) location.hash = '#/hoje';
render(<App />, document.getElementById('app')!);
