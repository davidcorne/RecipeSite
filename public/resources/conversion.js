const Conversion = {
    type: {
        weight: function() {
            console.log("weight");
            const fromSelect = document.getElementById('convert-from');
            // Add teaspoons/tablespoons/cups onto the convert from dropdown.
            
            const toSelect = document.getElementById('convert-to');
            // Add grams/ounces onto the convert to dropdown.
        },
        volume: function() {
            console.log("volume");
        }
    }
};

Conversion.setupIngredient = function(item) {
    Conversion.type[item.type]();
}

Conversion.onIngredientSelect = function(select) {
    Conversion.conversions.forEach(function(item) {
        if (item.ingredient === select.value) {
            Conversion.setupIngredient(item);
        }
    });
}
