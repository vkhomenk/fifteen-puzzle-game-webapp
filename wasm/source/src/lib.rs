use wasm_bindgen::prelude::*;

mod fifteen_solver;
use fifteen_solver::{solver, validate};
use rand::thread_rng;
use rand::seq::SliceRandom;

#[wasm_bindgen]
pub fn solve(tiles: Vec<u8>) -> String {
    match solver(tiles) {
        Ok(solution) => {
            println!("{solution}");
            solution
        },
        Err(err) => {
            println!("{err}");
            err
        },
    }
}

#[wasm_bindgen]
pub fn random_tiles() -> Vec<u8> {
    let mut tiles: Vec<u8> = (0..16).collect();
    loop {
        tiles.shuffle(&mut thread_rng());
        if validate(&tiles).is_ok() {
            return tiles;
        }
    }
    // let board = [
    //     [15, 14, 1, 6],
    //     [9, 11, 4, 12],
    //     [0, 10, 7, 3],
    //     [13, 8, 5, 2]
    // ];
    // let board = [
    // 	[ 0,15,14,13],
    // 	[12,11,10, 9],
    // 	[ 8, 7, 6, 5],
    // 	[ 4, 3, 2, 1],
    // ];
    // [11, 14, 10, 1, 13, 9, 7, 5, 8, 4, 6, 12, 2, 0, 15, 3].into()
    // board.into_iter().flatten().collect()
}
