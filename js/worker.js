import init, {solve, random_tiles} from "../wasm/rust_fifteen_solver.js";
await init();

const RQST_SOLVE = 0;
const RQST_RANDOM_TILES = 1;

onmessage = (message) => {
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