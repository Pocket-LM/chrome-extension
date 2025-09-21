import { useState } from "react";
import pocklmLogo from "@/assets/pocket_lm.svg";
import { Button } from "@/components/ui/button";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div
      id="root"
      className="w-[20rem] h-[20rem] flex flex-col items-center justify-center gap-4 p-4"
    >
      <div>
        <a href="#" target="_blank">
          <img src={pocklmLogo} className="logo" alt="Pocket LM logo" />
        </a>
      </div>
      <h1 className="text-xl font-medium">Pocket LM Chrome Extension</h1>
      <Button variant="outline" onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </Button>
      <p className="text-sm text-muted-foreground">
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
  );
}

export default App;
