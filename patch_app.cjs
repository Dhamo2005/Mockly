const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace AppLayout state and effects
const oldEffects = `  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { tests, attempts, srsItems } = useStore();

  useEffect(() => {
    let isMounted = true;
    const initDrive = async () => {
      const token = getAccessToken();
      if (token && !hasLoaded) {
        setIsSyncing(true);
        await loadFromDrive(token);
        if (isMounted) {
          setIsSyncing(false);
          setHasLoaded(true);
        }
      } else if (!token) { 
         setHasLoaded(true); // Allow local usage or show empty if not logged in
      }
    };
    initDrive();
    
    return () => { isMounted = false; };
  }, [user]);

  // Sync to drive whenever store changes
  useEffect(() => {
    const token = getAccessToken();
    if (token && hasLoaded) {
      const state = useStore.getState();
      saveToDrive(token, state);
    }
  }, [tests, attempts, srsItems, hasLoaded]);`;

code = code.replace(oldEffects, '');

const oldIsSyncingUI = `          {isSyncing && (
             <div className="absolute inset-0 bg-[var(--color-surface-container)]/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                   <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[var(--color-on-surface-variant)] font-medium">Syncing with Google Drive...</p>
                </div>
             </div>
          )}`;

code = code.replace(oldIsSyncingUI, '');

const syncManagerComponent = `const GlobalSync = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { tests, attempts, srsItems } = useStore();

  useEffect(() => {
    let isMounted = true;
    const initDrive = async () => {
      const token = getAccessToken();
      if (token && !hasLoaded) {
        setIsSyncing(true);
        await loadFromDrive(token);
        if (isMounted) {
          setIsSyncing(false);
          setHasLoaded(true);
        }
      } else if (!token) { 
         setHasLoaded(true);
      }
    };
    initDrive();
    
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    const token = getAccessToken();
    if (token && hasLoaded) {
      const state = useStore.getState();
      saveToDrive(token, state);
    }
  }, [tests, attempts, srsItems, hasLoaded]);

  if (isSyncing) {
    return (
       <div className="fixed inset-0 bg-[var(--color-surface-container)]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[var(--color-on-surface-variant)] font-medium">Syncing with Google Drive...</p>
          </div>
       </div>
    );
  }
  return null;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {`;

code = code.replace(`const AppLayout = ({ children }: { children: React.ReactNode }) => {`, syncManagerComponent);

code = code.replace(
`<Router>
      <Routes>`,
`<Router>
      <GlobalSync />
      <Routes>`
);

fs.writeFileSync('src/App.tsx', code);
