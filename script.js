// GLOBAL VARIABLES
// form controls
const form = document.querySelector(".calculator__controls");
const resetButton = document.querySelector(".calculator__reset-btn");
const billInput = form.querySelector("#billAmount");
const tipRadioButtons = document.querySelectorAll("input[name='tip']");
const peopleInput = document.getElementById("numberOfPeople");
// elements for calculated totals
const tipPerPerson = document.getElementById("tipPerPerson");
const totalPerPerson = document.getElementById("totalPerPerson");
// spans for error messages
const billError = document.getElementById("billError");
const peopleError = document.getElementById("peopleError");
// for custom button functionality
const customTipButton = document.getElementById("customButton");
const customTipLabel = document.getElementById("customButtonLabel");
const customTipRadio = document.getElementById("customRadio");
const customTipWrapper = document.getElementById("customTipWrapper");
const customTipInput = document.getElementById("customTip");

const tipReminder = document.getElementById("tipSelectionLabel");

// FUNCTIONS
function validate() {
    let valid = true;

    if (!billInput.validity.valid) {
        valid = false;
        if (billInput.validity.rangeUnderflow) {
            billInput.classList.add("invalid");
            billError.textContent = "Must be greater than zero";
        } else if (billInput.validity.badInput) {
            billInput.classList.add("invalid");
            billError.textContent = "Must be a number";
        }
        // in case the field is empty, we don't want to show any errors
    } else {
        billInput.classList.remove("invalid");
        billError.textContent = "";
    }
    
    if (!peopleInput.validity.valid) {
        valid = false;
        if (peopleInput.value.trim() === "0") {
            peopleInput.classList.add("invalid");
            peopleError.textContent = "Can't be zero"; // design wants this exact message, that's why I don't do it like with the bill
        } else if (peopleInput.validity.rangeUnderflow) {
            peopleInput.classList.add("invalid");
            peopleError.textContent = "Can't be negative";
        } else if (peopleInput.validity.badInput) {
            peopleInput.classList.add("invalid");
            peopleError.textContent = "Must be a number";
        }
        // in case the field is empty, we don't want to show any errors
    } else {
        peopleInput.classList.remove("invalid");
        peopleError.textContent = "";
    }

    let selectedTip = document.querySelector("input[name='tip']:checked");
    if (selectedTip?.value === "custom" && !customTipInput.validity.valid) {
        valid = false;
        customTipButton.classList.add("invalid");
    } else {
        customTipButton.classList.remove("invalid");
    }

    // check if a tip is selected only if both bill and people input are valid
    if (!valid) {
        return valid;
    }

    if (!selectedTip) {
        tipReminder.classList.add("error-message-left");
        valid = false;
    } else {
        tipReminder.classList.remove("error-message-left");
        customTipButton.classList.remove("invalid");
    }

    // if everything was valid
    return valid;
}

function getCurrentData() {
    let bill = parseFloat(billInput.value.trim());
    let people = parseInt(peopleInput.value.trim());
    
    let tip;
    let selectedTip = document.querySelector("input[name='tip']:checked");
    if (selectedTip.value === "custom") {
        tip = parseFloat(customTipInput.value.trim() / 100);
    } else {
        tip = parseFloat(selectedTip.value);
    }

    return [bill, people, tip];
}

function calculate(bill, people, tip) {
    tipPerPerson.textContent = `$${(Math.floor(((bill * tip) / people) * 100) / 100).toFixed(2)}`;
    totalPerPerson.textContent = `$${((bill * (1 + tip)) / people).toFixed(2)}`;
}

function hideErrors() {
    billInput.classList.remove("invalid");
    billError.textContent = "";
    peopleInput.classList.remove("invalid");
    peopleError.textContent = "";
    tipReminder.classList.remove("error-message-left");
    customTipButton.classList.remove("invalid");
}

function updateResults() {
    // if the form is in default state
    if (billInput.validity.valueMissing && 
        peopleInput.validity.valueMissing && 
        !document.querySelector("input[name='tip']:checked")) 
    {
        // disable the reset button
        resetButton.disabled = true;
        // clear any errors
        hideErrors();
    } else {
        // otherwise enable the reset button (because now the user has something to reset)
        resetButton.disabled = false;
    }

    let valid = validate();

    if (!valid) {
        tipPerPerson.textContent = "$0.00";
        totalPerPerson.textContent = "$0.00";
        return;
    } 

    let data = getCurrentData();
    calculate(...data);
}

function restrictInput(field, maxBeforeDot, allowDecimals = true, maxAfterDot = 2) {
    const allowedNonCharKeys =
    ['Enter', 'Escape', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Tab', 'Home', 'End'];
    
    const charRestriction = allowDecimals ? /^[0-9.,]$/ : /^[0-9]$/;
    const pasteRestriction = allowDecimals ? /[^0-9.,]/g : /[^0-9]/g;

    // add enter and esc functionality and prevent typing of invalid characters
    field.addEventListener("keydown", (e) => {
        
        if (e.key === "Enter") {
            e.preventDefault();
            field.blur();
            
            // move focus to next focusable element (like tab would)
            const focusableElements = Array.from(
                document.querySelectorAll('input, button, select, textarea, [tabindex]:not([tabindex="-1"])')
            ).filter(el => !el.disabled && !el.hidden && el.tabIndex >= 0);

            const currentIndex = focusableElements.indexOf(field);
            if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
                focusableElements[currentIndex + 1].focus();
            }

            return;

        } else if (e.key === "Escape") {
            field.blur();
        }

        if (allowedNonCharKeys.includes(e.key) || charRestriction.test(e.key)) {
            return;
        }

        e.preventDefault();
    });

    // to control how many digits the user can type into the number, accounts for decimal numbers too
    field.addEventListener("input", (e) => {
        let input = e.target.value.split(".");

        if (input[0]?.length > maxBeforeDot) {
            input[0] = input[0].slice(0, maxBeforeDot);

            if (input[1]) {
                e.target.value = input.join(".");
            } else {
                e.target.value = input[0];
            }
        }
        else if (input[1]?.length > maxAfterDot) {
            input[1] = input[1].slice(0, maxAfterDot);
            
            if (input[0]) {
                e.target.value = input.join(".");
            } else {
                e.target.value = "." + input[1];
            }
        }
    });

    // clear input from invalid characters if they were pasted
    field.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');

        // clean up from invalid characters
        const clean = pasted.replace(pasteRestriction, "");

        // enforce max length
        const [beforeDot = "", afterDot = ""] = clean.split(/[.,]/);
        let newValue = beforeDot.slice(0, maxBeforeDot);

        if (allowDecimals && clean.includes(".") || clean.includes(",")) {
            newValue += "." + afterDot.slice(0, maxAfterDot);
        }

        e.target.value = newValue;
    });
}

function cleanLeadingZeros(field) {
    field.addEventListener("input", (e) => {
        let input = e.target.value;

        if (/^0+(?!\.|$)/.test(input)) { // if there are leading zeros
            e.target.value = input.replace(/^0+(?!\.|$)/, ""); // remove them
        }
    });
}

// helper function to add all input restrictions to the fields more easily
function setupField(field, maxBeforeDot, allowDecimals = true, maxAfterDot = 2) {
    restrictInput(field, maxBeforeDot, allowDecimals, maxAfterDot);
    cleanLeadingZeros(field);
}

// EVENT LISTENERS SETUP
setupField(billInput, 4, true);
setupField(peopleInput, 2, false);
setupField(customTipInput, 2, false);

// updates the totals every time the calculator input changes
form.addEventListener("input", updateResults);

// to update the calculated totals whenever user chooses a different tip
form.addEventListener("change", (e) => {
    if (e.target.matches("input[name='tip']")) {
        
        if (e.target.value === "custom" && e.target.checked === true) {
            customTipLabel.classList.add("invisible");
            customTipWrapper.classList.remove("hidden");
            customTipInput.focus();
        }
        
        updateResults();
    }
});

// must be on the radio button because on label it didn't work
customTipRadio.addEventListener("click", (e) => {
    customTipInput.focus();
});
// for styling purposes
customTipInput.addEventListener("input", () => {
    const length = customTipInput.value.length;
    customTipInput.style.setProperty("--dynamic-width", `${Math.max(length, 1)}ch`);
});
customTipInput.addEventListener("focusout", (e) => {
    // if the new focus is still inside the custom button, do nothing
    if (customTipButton.contains(e.relatedTarget)) {
        return;
    }
    // otherwise
    // if the user didn't type any custom tip
    if (customTipInput.value.trim() === "") {
        // hide the input field
        customTipWrapper.classList.add("hidden");
        // and uncheck the custom tip
        customTipRadio.checked = false;
        // make the label visible
        customTipLabel.classList.remove("invisible");

        setTimeout(() => { // setTimeout to fix a flickering issue
            if (!document.querySelector("input[name='tip']:checked")) {
                updateResults();
            }
        }, 100);

    } else {
        // length can change on blur too if leading zero got removed
        const length = customTipInput.value.length;
        customTipInput.style.setProperty("--dynamic-width", `${Math.max(length, 1)}ch`);
    }
});

resetButton.addEventListener("click", (e) => {
    // after its clicked, disable it (the user has nothing to reset anymore)
    e.target.disabled = true;
    form.reset();
    // hide the custom tip input
    customTipWrapper.classList.add("hidden");
    customTipLabel.classList.remove("invisible");

    // clear errors
    hideErrors();

    // reset totals to 0 
    tipPerPerson.textContent = "$0.00";
    totalPerPerson.textContent = "$0.00";
});