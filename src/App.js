import logo from './logo.svg';
import './App.css';
import packageJson from '../package.json';

const appVersion = process.env.REACT_APP_VERSION || packageJson.version || '1';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <a
          className="App-link"
          href="https://example.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Jenkins on Udemy
        </a>
      </header>
      <p>
        Application version: {appVersion}
      </p>
    </div>
  );
}

export default App;
