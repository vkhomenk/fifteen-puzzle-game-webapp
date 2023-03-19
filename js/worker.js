importScripts("../wasm/fifteen_solver.js");

const RQST_SOLVE = 0;
const RQST_RANDOM_TILES = 1;
const { solve, random_tiles} = wasm_bindgen;

wasm_bindgen("../wasm/fifteen_solver_bg.wasm").then(_=> {
    self.onmessage = (message) => {
        const { request, input } = message.data;
    
        switch (request) {
            case RQST_SOLVE:
                postMessage({ request, result: solve(input) });
                break;
            case RQST_RANDOM_TILES:
                postMessage({ request, result: random_tiles() });
                break;
            default:
                console.error("No such request")
        }
    }
})