import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { config } from "@/config/environment";

const Test1 = () => {
    useEffect(() => {
        console.log("Test1 component mounted");
        console.log(config.server.apiUrl);
        return () => {
            console.log("Test1 component unmounted");
        };
    }, []);
    
    return <div>
        <Button>Test</Button>
    </div>;
};

export default Test1;