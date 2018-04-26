
function remove(array, element) {
    const index = array.indexOf(element);

    if (index !== -1) {
        array.splice(index, 1);
    }
}

function filterDuplicates(array) {
    let dups = [];

    for (let i = 0; i < array.length; i++) {
        if (dups.indexOf(array[i]) != -1) 
        { array.splice(i, 1); }
        else { dups.push(array[i]); }
    }
}

module.exports = { remove, filterDuplicates };