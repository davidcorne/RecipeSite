const sorter = function(a, b) {
    if(a.ingredient < b.ingredient) return -1;
    if(a.ingredient > b.ingredient) return 1;
    return 0;
}

module.exports.conversions = [
    {
        ingredient: 'Flour',
        type:       'weight',
        cup:        136
    },
    {
        ingredient: 'Almond Milk',
        type:       'volume',
        cup:        240
    },
].sort(sorter);

