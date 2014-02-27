var run_game = false; //Boolean that tracks whether the game is running or not

var currently_alive = {}; //A "set" containing the IDs for all currently live nodes
var currently_alive_timestep = {}; //A snapshot of the current board updated at each timestep
var total_height = 0; //The total number of rows for this game
var total_width = 0; //The total number of columns for this game
var total_num_rounds = 0; //The total number of rounds selected for this run of the game
var round = 0; //Tracks the current round of the game
var game_interval = {}; //Empty object that is populated by a setInterval(..) object to control game pace

var live_color = "#474747";
var dead_color = "#e0e0e0";
var live_highlight = "#2b2b2b";
var dead_highlight = "#b8b8b8";

/**
 * Takes in a DOM object (i.e. a node in the game) and brings it to life
 *
 * @param node      DOM object      The node to make live
 */
function makeLive(node){
    $(node).animate({
        backgroundColor: live_color
    })
    node.className = "alive";
    currently_alive[node.id] = true;
}

/**
 * Takes in a DOM object (i.e. a node in the game) and kills it
 *
 * @param node      DOM object      The node to kill
 */
function makeDead(node){
    $(node).animate({
        backgroundColor: dead_color
    });
    node.className = "dead";
    delete currently_alive[node.id];

}

/**
 * Highlights the node that the mouse is currently hovering over
 */
function highlightColor(){
    if(!run_game){
        var node = event.target;
        var is_alive = node.className == "alive";
        if(is_alive){
            $(node).animate({
                backgroundColor: live_highlight
            });
        }
        else{
            $(node).animate({
                backgroundColor: dead_highlight
            });
        }
    }
}

/**
 * Returns a node to its original color when mouse moves out of hover range
 */
function unhighlightColor(){
    if(!run_game){
        var node = event.target;
        var is_alive = node.className == "alive";
        if(is_alive){
            $(node).animate({
                backgroundColor: live_color
            });
        }
        else{
            $(node).animate({
                backgroundColor: dead_color
            });
        }
    }
}

/**
 * A timestep of the game, which
 * 1) populates the currently_alive_timestep with all live nodes in this timestep
 * 2) Finds every node that should be checked this timestep
 * 3) Iterates through those nodes, counting the number of surround live nodes for each
 * 4) Follows the rules of the game, killing or bringing to life the current node based on the above value
 */
function timestep(){
    console.log("Round..." + round);
    if(run_game && round < total_num_rounds){

        currently_alive_timestep = {};
        for(var node_id in currently_alive){
            currently_alive_timestep[node_id] = true;
        }

        var nodes_to_check = compileNodesToCheck();

        for (var node_id in nodes_to_check){

            var surrounding_live_count = countSurroundingLiveNodes(node_id);
            var node = document.getElementById(node_id);
            var is_alive = node.className == "alive";

            if (is_alive && surrounding_live_count<2){
                makeDead(node);
            }
            else if (is_alive && (surrounding_live_count==2 || surrounding_live_count==3)){
                makeLive(node);
            }
            else if (is_alive &&surrounding_live_count > 3){
                makeDead(node);
            }
            else if(!is_alive && surrounding_live_count == 3) {
                makeLive(node);
            }
            else {}

            delete nodes_to_check[node_id];
        }
        round++;
    }
    else{
       window.clearInterval(game_interval);
    }
}
/**
 * Takes in the ID of a node and returns the number of surrounding live nodes
 *
 * @param   node_id         string      The ID of the node being checked
 * @returns live_counter    int         The total number of live nodes surrounding the given node
 */
function countSurroundingLiveNodes(node_id){

    var xy_array = node_id.split('-');
    var x = parseInt(xy_array[0]);
    var y = parseInt(xy_array[1]);
    var live_counter = 0;

    for(col=(x-1); col<=(x+1); col++){
        for(row=(y-1); row<=(y+1); row++){
            if(col>0 && col<=total_width && row>0 && row<=total_height){

                var check_node_id = col + "-" + row;
                var is_alive = (check_node_id in currently_alive_timestep);

                if(check_node_id != node_id && is_alive){
                    live_counter = live_counter+1;
                }
            }
        }
    }
    return live_counter;
}

/**
 * Iterates through all currently live nodes and populates the to_check object with the surrounding
 * nodes of each live node (i.e. the only nodes that could potentially change state this timestep)
 */
function compileNodesToCheck(){
    var nodes_to_check = {};
    for(var node in currently_alive_timestep){
        var node_id = node;

        var xy_array = node_id.split('-');
        var x = parseInt(xy_array[0]);
        var y = parseInt(xy_array[1]);

        for(col=(x-1); col<=(x+1); col++){
            for(row=(y-1); row<=(y+1); row++){
                if(col>0 && col<=total_width && row>0 && row<=total_height){

                    var check_node_id = col + "-" + row;
                    nodes_to_check[check_node_id] = true;
                }
            }
        }
    }
    return nodes_to_check;
}

/**
 * Changes the color and class of squares with a mouse click (used for pre-setting a game)
 */
$( "body" ).click(function( event ) {
    if(!run_game){
        var node = event.target;
        countSurroundingLiveNodes(node.id);
        if (node.className == "dead"){
            makeLive(node);
        }
        else if (node.className == "alive"){
            makeDead(node);
        }
    }
});

/**
 * Creates a new board, based on the input of # of rows and # of columns
 */
function generateBoard(){
    var width = document.getElementById("width").value;
    total_width = width;
    var height = document.getElementById("height").value;
    total_height = height;
    var board = document.getElementById("board");
    $("#board").html("");
    currently_alive = {};
    for(var row_num = 1; row_num <= height; row_num++){
        var row = document.createElement("div");
        row.className = "row";
        for(var col_num = 1; col_num <= width; col_num++){
            var cell = document.createElement("div");
            cell.className = "dead";
            var cell_id = col_num + "-" + row_num;
            cell.id = cell_id;
            cell.onmouseover = function(){highlightColor();};
            cell.onmouseout = function(){unhighlightColor();};

            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

/**
 *
 * Disables input (true) or enables input (false)
 *
 * @param   status    bool    Whether the input should be disabled or not
 */
function toggleInput(status){
    var attributes = new Array("width", "height", "new_board", "num_rounds");
    for(var attr in attributes){
        document.getElementById(attributes[attr]).disabled = status;
    }
}

/**
 * Changes whether the game is currently running or not
 */
function startGame(){
    button = document.getElementById("gameToggle");
    if (run_game){
        console.log("Game stopped");
        button.value = "Start Game"
        run_game = false;
        round = 0;
        toggleInput(false);
    }
    else{
        console.log("Game started");
        button.value = "Stop Game"
        run_game = true;
        toggleInput(true);
        total_num_rounds = document.getElementById("num_rounds").value;
        game_interval = setInterval(function(){timestep()},500);
    }
}