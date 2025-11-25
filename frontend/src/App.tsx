import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Landing } from './pages/Landing';
import { AppLayout as AppPage } from './pages/App';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <Router>
        <Routes>
          <Route path="/app" element={<AppPage />} />
          <Route path="/" element={
            <div className="min-h-screen bg-midnight-graphite flex flex-col">
              <Header />
              <main className="flex-grow">
                <Landing />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/features" element={
            <div className="min-h-screen bg-midnight-graphite flex flex-col">
              <Header />
              <main className="flex-grow">
                <Landing />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/use-cases" element={
            <div className="min-h-screen bg-midnight-graphite flex flex-col">
              <Header />
              <main className="flex-grow">
                <Landing />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/docs" element={
            <div className="min-h-screen bg-midnight-graphite flex flex-col">
              <Header />
              <main className="flex-grow">
                <Landing />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/about" element={
            <div className="min-h-screen bg-midnight-graphite flex flex-col">
              <Header />
              <main className="flex-grow">
                <Landing />
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
