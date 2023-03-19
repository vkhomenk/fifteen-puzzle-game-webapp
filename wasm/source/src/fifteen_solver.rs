const DESIRED_ROW: [Int; 16] = [3, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
const DESIRED_COL: [Int; 16] = [3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2];
const SOLVED_STATE: u64 = 0x123456789abcdef0;

type Int = i16;

#[derive(Clone)]
struct State {
    free_row: Int,
    free_col: Int,
    board: u64,
    step: u8,
    path_cost: Int,
}

impl State {
    fn new(tiles: Vec<u8>) -> Self {
        let iter = tiles.into_iter();
        let zero_index = iter.clone().position(|e| e == 0).unwrap() as Int;
        let compact_representation = iter
            .clone()
            .map(|n| u64::from(n))
            .enumerate()
            .fold(0u64, |acc, (i, n)| {
                let compressed_size = 4;
                let shift = (15 - i) * compressed_size;
                acc | (n << shift)
            });

        Self {
            free_row: zero_index / 4,
            free_col: zero_index % 4,
            board: compact_representation,
            path_cost: 0,
            step: 0,
        }
    }

    fn m_down(&self) -> State {
        let zero_location = self.free_row * 4 + self.free_col;
        let num_location = (15 - 4 - zero_location) * 4;
        let num_bits = self.board & (15u64 << num_location);
        let is_bad_move = self.free_row < DESIRED_ROW[(num_bits >> num_location) as usize];

        State {
            step: b'd',
            path_cost: self.path_cost + is_bad_move as Int,
            board: self.board - num_bits + (num_bits << 16),
            free_row: self.free_row + 1,
            free_col: self.free_col,
        }
    }

    fn m_up(&self) -> State {
        let zero_location = self.free_row * 4 + self.free_col;
        let num_location = (15 + 4 - zero_location) * 4;
        let num_bits = self.board & (15u64 << num_location);
        let is_bad_move = self.free_row > DESIRED_ROW[(num_bits >> num_location) as usize];

        State {
            step: b'u',
            path_cost: self.path_cost + is_bad_move as Int,
            board: self.board - num_bits + (num_bits >> 16),
            free_row: self.free_row - 1,
            free_col: self.free_col,
        }
    }

    fn m_right(&self) -> State {
        let zero_location = self.free_row * 4 + self.free_col;
        let num_location = (15 - 1 - zero_location) * 4;
        let num_bits = self.board & (15u64 << num_location);
        let is_bad_move = self.free_col < DESIRED_COL[(num_bits >> num_location) as usize];

        State {
            step: b'r',
            path_cost: self.path_cost + is_bad_move as Int,
            board: self.board - num_bits + (num_bits << 4),
            free_row: self.free_row,
            free_col: self.free_col + 1,
        }
    }

    fn m_left(&self) -> State {
        let zero_location = self.free_row * 4 + self.free_col;
        let num_location = (15 + 1 - zero_location) * 4;
        let num_bits = self.board & (15u64 << num_location);
        let is_bad_move = self.free_col > DESIRED_COL[(num_bits >> num_location) as usize];

        State {
            step: b'l',
            board: self.board - num_bits + (num_bits >> 4),
            path_cost: self.path_cost + is_bad_move as Int,
            free_row: self.free_row,
            free_col: self.free_col - 1,
        }
    }
}

struct PathExplorer {
    initial_state: State,
    solution_from_end: Vec<State>,
    course_deviation_limit: Int,
}

impl PathExplorer {
    fn new(tiles: Vec<u8>) -> PathExplorer {
        Self {
            solution_from_end: Vec::with_capacity(80),
            initial_state: State::new(tiles),
            course_deviation_limit: 0,
        }
    }

    fn explore(&mut self, state: &State) -> bool {
        let mut check = |state: State| {
            if state.board == SOLVED_STATE
            || state.path_cost <= self.course_deviation_limit
            && self.explore(&state) {
                self.solution_from_end.push(state);
                return true;
            }
            false
        };

        if state.free_row != 3 && state.step != b'u' && check(state.m_down()) {
            return true;
        }
        if state.free_row != 0 && state.step != b'd' && check(state.m_up()) {
            return true;
        }
        if state.free_col != 3 && state.step != b'l' && check(state.m_right()) {
            return true;
        }
        if state.free_col != 0 && state.step != b'r' && check(state.m_left()) {
            return true;
        }
        false
    }

    fn solve(&mut self) -> String {
        if self.initial_state.board == SOLVED_STATE {
            return "".into();
        }
        
        let initial_state = self.initial_state.clone();
        while !self.explore(&initial_state) {
            self.course_deviation_limit += 2;
        }
        self.solution_from_end
            .iter()
            .rev()
            .map(|state| state.step as char)
            .collect()
    }
}

fn inversions(tiles: &Vec<u8>) -> Int {
    let mut inversions = 0;

    for (i, &number) in tiles.iter().enumerate() {
        if number == 0 {
            continue
        }
        let next_numbers = &tiles[i + 1..];
        for &next_number in next_numbers {
            if next_number == 0 {
                continue
            }
            if number > next_number {
                inversions += 1;
            }
        }
    }

    inversions
}

pub fn validate(tiles: &Vec<u8>) -> Result<(), String> {
    if tiles.len() != 16 {
        return Err("Incomplete input".into());
    }

    let mut sorted = tiles.clone();
    sorted.sort();
    if (0..16).ne(sorted.into_iter()) {
        return Err("Invalid or duplicate numbers".into());
    }

    let free_cell_row = tiles.iter().position(|n| *n == 0).unwrap() as Int / 4;
    let is_row_odd = free_cell_row % 2;
    let is_inversions_odd = inversions(tiles) % 2;

    if is_inversions_odd == is_row_odd {
        return Err("Invalid Permutation".into());
    }

    Ok(())
}

pub fn solver(tiles: Vec<u8>) -> Result<String, String> {
    validate(&tiles)?;
    Ok(PathExplorer::new(tiles).solve())
}
