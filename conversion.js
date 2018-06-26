const sorter = function (a, b) {
  if (a.ingredient < b.ingredient) return -1
  if (a.ingredient > b.ingredient) return 1
  return 0
}

module.exports.conversions = [
  {
    ingredient: 'Flour',
    type: 'weight',
    cup: 136
  },
  {
    ingredient: 'Almond Milk',
    type: 'volume',
    cup: 240
  },
  {
    ingredient: 'Sugar',
    type: 'weight',
    cup: 225
  },
  {
    ingredient: 'Double Cream',
    type: 'volume',
    cup: 240
  },
  {
    ingredient: 'Dulce de Leche',
    type: 'weight',
    cup: 304
  },
  {
    ingredient: 'Grand Marnier',
    type: 'volume',
    cup: 240
  },
  {
    ingredient: 'White Chocolate',
    type: 'weight',
    cup: 175
  },
  {
    ingredient: 'Breadcrumbs',
    type: 'weight',
    cup: 125
  },
  {
    ingredient: 'Parmesan',
    type: 'weight',
    cup: 100
  },
  {
    ingredient: 'Chives',
    type: 'weight',
    cup: 48
  },
  {
    ingredient: 'Butter',
    type: 'weight',
    cup: 225
  },
  {
    ingredient: 'Maple Syrup',
    type: 'volume',
    cup: 240
  },
  {
    ingredient: 'Vinegar',
    type: 'volume',
    cup: 240
  },
  {
    ingredient: 'Peanut Butter',
    type: 'weight',
    cup: 250
  }
].sort(sorter)
