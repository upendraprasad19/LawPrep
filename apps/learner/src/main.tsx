import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { StudyApp } from './router';
import { AccountProvider } from './features/auth/context';
import './styles.css';
const root = document.getElementById('root');
if (!root) throw new Error('Study app root is missing');
createRoot(root).render(<StrictMode><HashRouter><AccountProvider><StudyApp/></AccountProvider></HashRouter></StrictMode>);
