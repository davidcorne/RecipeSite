const Conversion = {
  inputAdjustment: {
    'Teaspoons': 0.02501982821385948364078532236798,
    'Tablespoons': 0.07505929684450716065691896598313,
    'Cups': 1
  },
  outputAdjustment: {
    'Grams': 1,
    'Ounces': 0.035274,
    'Milliliters': 1
  },
  addOption: function (select, text) {
    const option = document.createElement('option')
    option.text = text
    select.add(option)
  },
  type: {
    weight: function () {
      const fromSelect = document.getElementById('convert-from')
      Conversion.clearSelect(fromSelect)
      // Add teaspoons/tablespoons/cups onto the convert from dropdown.
      Conversion.addOption(fromSelect, 'Teaspoons')
      Conversion.addOption(fromSelect, 'Tablespoons')
      Conversion.addOption(fromSelect, 'Cups')

      const toSelect = document.getElementById('convert-to')
      Conversion.clearSelect(toSelect)
      // Add grams/ounces onto the convert to dropdown.
      Conversion.addOption(toSelect, 'Grams')
      Conversion.addOption(toSelect, 'Ounces')
    },
    volume: function () {
      const fromSelect = document.getElementById('convert-from')
      Conversion.clearSelect(fromSelect)
      // Add teaspoons/tablespoons/cups onto the convert from dropdown.
      Conversion.addOption(fromSelect, 'Teaspoons')
      Conversion.addOption(fromSelect, 'Tablespoons')
      Conversion.addOption(fromSelect, 'Cups')

      const toSelect = document.getElementById('convert-to')
      Conversion.clearSelect(toSelect)
      // Add milliliters onto the convert to dropdown.
      Conversion.addOption(toSelect, 'Milliliters')
    }
  }
}

Conversion.clearSelect = function (select) {
  // Don't remove the first element, it's a disabled "Please Choose" option.
  // Note, you can only remove by index so you need to do this loop in
  // reverse as shown here.
  for (let i = select.options.length - 1; i >= 1; --i) {
    select.remove(i)
  }
}

Conversion.setupIngredient = function (item) {
  // Set the right type
  Conversion.type[item.type]()
  // Set the ingredient conversion rate
  Conversion.ingredientRate = item.cup
  // Update the rate
  Conversion.rateChange()
}

Conversion.onIngredientSelect = function (select) {
  Conversion.conversions.forEach(function (item) {
    if (item.ingredient === select.value) {
      Conversion.setupIngredient(item)
    }
  })
}

Conversion.update = function () {
  // Get the amount input
  const inputDom = document.getElementById('user-input')
  const input = parseInt(inputDom.value)
  const output = Math.round(Conversion.rate * input)

  // Write the output to the output window
  const outputDom = document.getElementById('output')
  outputDom.value = isNaN(output) ? '' : output
}

Conversion.rateChange = function () {
  // adjust for output
  const toSelect = document.getElementById('convert-to')
  const to = toSelect.value

  // ingredientRate is cups to grams or milliliters, adjust this for the
  // selected rates
  const fromSelect = document.getElementById('convert-from')
  const from = fromSelect.value

  Conversion.rate =
        Conversion.inputAdjustment[from] *
        Conversion.ingredientRate *
        Conversion.outputAdjustment[to]
  // Update the output
  Conversion.update()
}
