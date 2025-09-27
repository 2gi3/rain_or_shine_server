import app from "./app.js";
import { hello } from "./hello.js";

const PORT = 3000;

app.listen(PORT, () => {
    hello();
    console.log(`🚀 Hello,  Server running on: http://localhost:${PORT}`);
});
