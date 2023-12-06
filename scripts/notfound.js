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

function notfound(){
    const orig_text = document.querySelector("h2").innerHTML;

    window.setInterval(function(){
        random_title_remove(orig_text);
    }, 500);
}

window.addEventListener("load", notfound);