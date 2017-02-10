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
    {
        ingredient: 'Sugar',
        type:       'weight',
        cup:        0
    },
    {
        ingredient: 'Double Cream',
        type:       'volume',
        cup:        0
    },
    {
        ingredient: 'Dulce de Leche',
        type:       'weight',
        cup:        0
    },
    {
        ingredient: 'Grand Marnier',
        type:       'volume',
        cup:        0
    },
    {
        ingredient: 'White Chocolate',
        type:       'weight',
        cup:        0
    },
    {
        ingredient: 'Breadcrumbs',
        type:       'weight',
        cup:        0
    },
    {
        ingredient: 'Parmesan',
        type:       'weight',
        cup:        0
    },
    {
        ingredient: 'Chives',
        type:       'weight',
        cup:        0
    },
    {
        ingredient: 'Butter',
        type:       'weight',
        cup:        0
    },
    {
        ingredient: 'Maple Syrup',
        type:       'volume',
        cup:        0
    },
    {
        ingredient: 'Vinegar',
        type:       'volume',
        cup:        0
    },
    {
        ingredient: 'Peanut Butter',
        type:       'weight',
        cup:        0
    },
].sort(sorter);

