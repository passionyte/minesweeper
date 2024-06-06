// sweeper.js written by Passionyte

const tilesets = [ // Pre assumed puzzles (available via button on site)
    {id: "beginner", x: 9, y: 9, mines: 10},
    {id: "intermediate", x: 16, y: 16, mines: 40},
    {id: "expert", x: 30, y: 16, mines: 99}
]

// Various properties
let timer = 0
let flags = 0
let gameover = false 
let first = false
let win = false
let clicks = 0
let chords = 0

let puzzle
let set
let interval

// Preferences (Defaults)
let theme = "temp"

// Common UI Elements (for ease of access if used more than once)
const sun = document.getElementById("sun")

function counter(diff) { // Used in main display() tick, but it would be inefficient to have the display() function run every second for the timer counter
    if (diff) { // Update flag counter
        let safeflags = Math.abs(flags) // Utilize the absolute value of 'flags', as flags can be negative and it can cause issues

        let h = Math.floor((safeflags / 100))
        let t = (Math.floor((safeflags / 10)) - (h * 10))
        let o = Math.floor((safeflags - ((h * 100) + (t * 10))))

        if (safeflags > 999) { // Cap at 999
            h = 9
            t = 9
            o = 9
        }

        // Display negatives accordingly
        if (flags < -9 && flags > -100) { 
            t = Math.abs(t)
            h = "-"
        }
        else if (flags < 0 && flags > -10) {
            o = Math.abs(o)
            t = "-"
        }
    
        // Assign number images
        document.getElementById("flags000").style.backgroundImage = "url("+`images/${theme}/d${h}.png`+")"
        document.getElementById("flags00").style.backgroundImage = "url("+`images/${theme}/d${t}.png`+")"
        document.getElementById("flags0").style.backgroundImage = "url("+`images/${theme}/d${o}.png`+")"
    }
    else { // Update time counter
        let th = Math.floor((timer / 100)) // 'timer' should never be negative so no code for negative number displays is needed
        let tt = (Math.floor((timer / 10)) - (th * 10))
        let to = Math.floor((timer - ((th * 100) + (tt * 10))))

        if (timer > 999) { // Cap at 999
            th = 9
            tt = 9
            to = 9
        }

        // Assign number images
        document.getElementById("timer000").style.backgroundImage = "url("+`images/${theme}/d${th}.png`+")"
        document.getElementById("timer00").style.backgroundImage = "url("+`images/${theme}/d${tt}.png`+")"
        document.getElementById("timer0").style.backgroundImage = "url("+`images/${theme}/d${to}.png`+")"
    }
}

function tick() { // Increments timer (called by setInterval) and updates the counter
    timer++
    counter()
}

function results(show) { // Displays and updates the results screen upon winning / losing
    clearInterval(interval) // Stops the timer
    interval = null // Necessary because clearInterval does not assign argument to null

    document.getElementById("results").hidden = (!show)

    if (show) { // Results thing
        document.getElementById("resultstitle").innerText = (win) && "Congratulations!" || "Game Over!"
        document.getElementById("resultsmsg").innerText = (win) && "You win!" || "Too bad. So sad."
        document.getElementById("clicks").innerHTML = `Clicks: ${clicks}`
        document.getElementById("chords").innerHTML = `Chords: ${chords}`
        document.getElementById("flagsplaced").innerHTML = `Flags Placed: ${(set.mines - flags)}`
        document.getElementById("rawtime").innerHTML = `Raw Time: ${timer}`
    }
}

function won() { // Check if player has WON?!
    const sum = (puzzle.length - set.mines)
    let progress = 0

    for (let i = 0; (i < puzzle.length); i++) {
        if (puzzle[i].visible && !puzzle[i].mine) {
            progress++
        }
    }

    return (progress >= sum)
}

function clearcheck(adjs) { // Checks adjacents for clear tiles
    for (let i = 0; (i < adjs.length); i++) {
        if (adjacentmines(adjs[i]) == 0) {
            return true
        }
    }

    return false
}

function chord(tile, special) { // Chords from a given tile
    const adjs = adjacents(tile)

    if (special) {
        flagcount = adjacentflags(tile)
    }

    let lastmines = -1

    for (let i = 0; (i < adjs.length); i++) {
        const check = adjs[i]

        if (check.mine && !special) {
            break
        }

        const mines = adjacentmines(check)
        const flags = adjacentflags(check)

        if ((clearcheck(adjs) || (special && (((flagcount > 0) || (flags > 0)) && flags == flagcount)) || (lastmines == mines)) && (!check.visible && !check.mine)) {
            check.visible = true

            chord(check, special)
        }

        if (mines > 0) {
            lastmines = mines
        }
    }
}


function tileimage(tile) { // Return tile image name
    if (tile.flag) {
        if (gameover && !tile.mine) {
            return "mine_wrong"
        }
        else {
            return "flag"
        }
    }
    else if (gameover && tile.mine) {
        if (!tile.kill) {
            return (!win) && "mine" || "flag"
        }
        else {
            return "mine_red"
        }
    }
    else if (tile.visible || win) {
        let mines = adjacentmines(tile)

        if (mines > 0) {
            return `type${mines}`
        }
        else {
            return "pressed"
        }
    }
    return "closed"
}

function adjacents(tile) { // Returns the tiles adjacent to the given tile
    let adjs = []

    for (let x = (tile.x - 1); (x < tile.x + 2); x++) { // This will return the adjacent tiles
        for (let y = (tile.y - 1); (y < tile.y + 2); y++) {
            for (let i = 0; (i < puzzle.length); i++) {
                let adj = puzzle[i]

                if (adj.x == x && adj.y == y) {
                    adjs.push(adj)
                }
            }
        }
    }

    return adjs
}

function adjacentmines(tile) { // Returns the # of mines around a given tile
    const adjs = adjacents(tile)
    let mines = 0

    for (let i = 0; (i < adjs.length); i++) { // Count the mines
        if (adjs[i].mine) {
            mines++
        }
    }

    return mines
}

function adjacentflags(tile) { // Returns the # of flags around a given tile
    const adjs = adjacents(tile)
    let flags = 0

    for (let i = 0; (i < adjs.length); i++) { // Count the flags
        if (adjs[i].flag) {
            flags++
        }
    }

    return flags
}

function flag(mouse) { // Flag our tile
    if (gameover) {
        return
    }

    if (!interval) {
        interval = setInterval(tick, 1000) // Get timer going
    }

    const tile = puzzle[parseInt(mouse.target.id)]

    if (!tile.visible) {
        if (!tile.flag) { // If not flagged, flag, if flagged, remove the flag
            tile.flag = true
            flags--
        }
        else {
            tile.flag = false
            flags++
        }
    }
   
    display()
}

function tiledown(mouse) { // Simple press / hold image change for closed tiles and sun, no *real* functionality
    if (gameover) {
        return
    }

    sun.src = `images/${theme}/face_active.png`

    const tile = puzzle[parseInt(mouse.target.id)]

    if (!tile.visible & !tile.flag) {
        mouse.target.src = `images/${theme}/pressed.png`
    }
}

function tileup(mouse) { // Actual left mouse button input / click
    if (gameover) {
        return
    }

    if (!interval) {
        interval = setInterval(tick, 1000) // Get timer going
    }

    sun.src = `images/${theme}/face_unpressed.png`

    const id = parseInt(mouse.target.id)
    const tile = puzzle[id]

    if (tile.flag) { // Ignore flag clicks
        return
    }

    clicks++

    if (first) { // Prevents mines from being on your first click, lol
        first = false
        if (tile.mine) {
            tile.mine = false

            for (let i = (id + 1); (i < puzzle.length); i++) { // Move this mine to the nearest clear tile (may need work)
                let check = puzzle[i]

                if (!check.mine) {
                    check.mine = true
                    break
                }
            }
        }
    }

    if (!tile.mine && !tile.visible) { // Forcibly reveal this tile
        tile.visible = true
        
        if (adjacentmines(tile) == 0) {
            const adjs = adjacents(tile)

            for (let i = 0; (i < adjs.length); i++) { // Check for chording
                chord(adjs[i])
            }
        }
    }
    else if (!tile.mine) { // Chord
        chord(tile, true)
        chords++
    }
    else { // BOOM!
        tile.kill = true
        gameover = true

        results(true)
        sun.src = `images/${theme}/face_lose.png`
    }

    if (won()) { // Victory!
        gameover = true
        win = true

        results(true)
        sun.src = `images/${theme}/face_win.png`
    }

    display()
}

function hi() {
    console.log("hi")
}

function display() { // Given current data, let's update our display!
    const puzzleui = document.getElementById("puzzle")

    document.getElementById("tiles").innerHTML = "" // Clear existing tiles

    // Ensure puzzle has the proper scale for the tile set
    puzzleui.style.width = `${(set.x * 24)}px` 
    puzzleui.style.height = `${(set.y * 24)}px`

    let id = 0 // Begin creating the tiles within the given set's x and y values
    for (let y = 0; (y < set.y); y++) {
        for (let x = 0; (x < set.x); x++) {
            let tile = document.getElementById("tiledummy").cloneNode()
            tile.id = id
            tile.hidden = false

            tile.src = `images/${theme}/${tileimage(puzzle[id])}.png` // Load tile image

            tiles.appendChild(tile)

            // Input stuff
            tile.addEventListener("mousedown", mouse => { // Differentiate between LMB for sweeping and RMB for flagging
                (mouse.button == 0) && tiledown(mouse) || (mouse.button == 2) && flag(mouse)
            })
            tile.addEventListener("mouseup", mouse => { // Only allow LMB
                (mouse.button == 0) && tileup(mouse)
            })
            tile.addEventListener("contextmenu", mouse => { // Disables the context menu / right click menu respectively
                mouse.preventDefault()
            })

            id++
        }
    }

    // Counters

    counter(true)
    counter()
} 

function game() { // Start a new game
    // Set player-based properties upon starting
    flags = set.mines
    timer = 0
    gameover = false
    first = true
    win = false
    clicks = 0
    chords = 0

    sun.src = `images/${theme}/face_unpressed.png`

    results() // Hide results
    display() // Load display, and we're ready to go!
}

function generate(mode) { // Generates a puzzle based on either the selected mode; or custom properties which the user presumably inputted
    if (!mode.mines) { // Determine the set through the input object (when 'mode' is not identified as a set)
        if (mode.target.id != "generate") { // If not a custom puzzle, then find the associated tileset data
            for (let i = 0; (i < tilesets.length); i++) {
                if (tilesets[i].id == mode.target.id) {
                    set = tilesets[i]
                    break
                }
            }
        }
        else {
            // Pull custom puzzle set from text boxes
            set = {}
            set.x = parseInt(document.getElementById("x").value)
            set.y = parseInt(document.getElementById("y").value)
            set.mines = parseInt(document.getElementById("mines").value)
    
            if ((isNaN(set.x) || isNaN(set.y) || isNaN(set.mines)) || (set.x  < 2 || set.y < 2)) { // Do not create the board if any of the set numbers are NaN
                return
            }
    
            if (set.mines > (set.x * set.y)) { // If the mine count is larger than the # of tiles of the set, then cap it
                set.mines = (set.x * set.y)
            }
        }
    }
    else { // The provided 'mode' *is* a set
        set = mode
    }
    
    puzzle = []
    for (y = 0; (y < set.y); y++) { // Create the base for the tiles
        for (x = 0; (x < set.x); x++) {
            puzzle.push({ // Define some 'default' variables
                x: x,
                y: y,
                mine: false,
                flag: false,
                visible: false
         })
        }
    }

    let index = 0
    let mines = 0
    while (true) { // Mine generation; each tile has a 13% chance of being a mine
        if (Math.random() < 0.13) {
            puzzle[index].mine = true
            mines++
            if (mines >= set.mines) { // We've achieved the number of mines we need, break the loop
                break
            }
        }

        index++

        if (index >= (puzzle.length - 1)) { // Ensure we continue the loop until it breaks
            index = 0
        }
    }

    game() // Let's start our new game!
}

// BUTTONS
document.getElementById("beginner").addEventListener("click", generate)
document.getElementById("intermediate").addEventListener("click", generate)
document.getElementById("expert").addEventListener("click", generate)
document.getElementById("custom").addEventListener("click", _ => { // Hide/show the options for a Custom puzzle
    document.getElementById("options").hidden = !document.getElementById("options").hidden
})
document.getElementById("generate").addEventListener("click", generate)

// SUN
sun.addEventListener("mousedown", _ => {
    sun.src = `images/${theme}/face_pressed.png`
})
sun.addEventListener("mouseup", _ => {
    sun.src = `images/${theme}/face_unpressed.png`
    if (set) { // Serves as a promptu restart button
        generate(set)
    }
})

// PREFERENCES

const apply = document.getElementById("apply")
const warning = document.getElementById("warning")

// Show hide preference warning (resets game, that's why)
apply.addEventListener("mouseenter", _ => {
    warning.hidden = false
})
apply.addEventListener("mouseleave", _ => {
    warning.hidden = true
})
apply.addEventListener("click", _ => { // Apply new preferences
    // Preference assigning
    theme = document.getElementById("theme").value

    if (set) { // Reset current game
        generate(set)
    }
})