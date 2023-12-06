const DONT_REMOVE = [".", " ", "!"];
function random_item(string_or_array){
    let ret = string_or_array[Math.floor(Math.random() * string_or_array.length)];
    while (ret in DONT_REMOVE){
        ret = string_or_array[Math.floor(Math.random() * string_or_array.length)];
    }
    return ret;
}

function random_title_remove(txt){
    let itm_to_remove = random_item(txt);
    document.querySelector("h2").innerHTML = txt.replace(itm_to_remove, "<mark class='invisible_letters'>" + itm_to_remove + '</mark>');
}

const H2_CHANGES = ["doesn't exist", "is in another castle", "was stolen by some evil lord",
"fell into some buggy spikes, heh heh"]

const H3_POSSIBLE_CONTENTS = [
    "Perhaps going back to the home page would be better to start looking again?",
    "I suggest using the Warp Zone to find what you want!",
    "It might be inside Death Mountain...",
    "Not many choices here. You gotta debug it to see why it became buggy.",
]

const A_VARIANTS = ["Go back to the home page", "Enter the Warp Zone", "Venture inside Death Mountain",
"Debug the thing"]

function random_title_and_content(){
    let item = Math.floor(Math.random() * 4)
    let header = document.querySelector("h2");
    let lower = document.querySelector("h3");
    let link = document.getElementById("random_flavoured");
    header.innerHTML = header.innerHTML.replace("doesn't exist", H2_CHANGES[item]);
    lower.innerHTML = H3_POSSIBLE_CONTENTS[item];
    link.innerHTML = A_VARIANTS[item];
}

function notfound(){
    random_title_and_content();

    const orig_text = document.querySelector("h2").innerHTML;

    window.setInterval(function(){
        random_title_remove(orig_text);
    }, 500);
}

window.addEventListener("load", notfound);