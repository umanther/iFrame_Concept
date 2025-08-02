// Declare in global scope
let pageFamilyChoices;
let headerFamilyChoices;

function initChoice(selector) {
    return new Choices(selector, {
        searchEnabled: true,
        itemSelectText: "",
        shouldSort: true
    });
}

document.addEventListener("DOMContentLoaded", () => {
    pageFamilyChoices = initChoice("#pageFamily");
    headerFamilyChoices = initChoice("#headerFamily");
});