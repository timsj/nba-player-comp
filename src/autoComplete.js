const debounce = (func, delay = 1000) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
};

export const createAutoComplete = ({
  root,
  renderOption,
  onOptionSelect,
  inputValue,
  fetchData,
}) => {
  root.innerHTML = `
    <input type="search" class="input" onfocus="this.value=''" placeholder="&#128269;&nbsp&nbsp;Search for a player here"/>
    <div class="dropdown">
        <div class="dropdown-menu">
            <div class="dropdown-content results"></div>
        </div>
    </div>
`;

  const input = root.querySelector("input");
  const dropdown = root.querySelector(".dropdown");
  const resultsWrapper = root.querySelector(".results");

  const onInput = async (event) => {
    //initialize search results array variable
    let results;

    //if input is not empty, fetch data and save to results
    if (input.value) {
      results = await fetchData(event.target.value);
    }

    if (results) {
      if (!results.length) {
        dropdown.classList.remove("is-active"); //if search result array is empty, deactivate dropdown
        return; //exit out of entire onInput function
      }

      resultsWrapper.innerHTML = ""; //clears previous results on new search results
      dropdown.classList.add("is-active");

      for (let result of results) {
        const option = document.createElement("a");
        option.classList.add("dropdown-item");
        option.innerHTML = renderOption(result);
        option.addEventListener("click", () => {
          dropdown.classList.remove("is-active");
          input.value = inputValue(result);
          onOptionSelect(result);
        });

        resultsWrapper.appendChild(option);
      }
    } else {
      dropdown.classList.remove("is-active"); //if search input is empty, deactivate dropdown
      return; //exit out of entire onInput function
    }
  };

  input.addEventListener("input", debounce(onInput, 500));

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) {
      dropdown.classList.remove("is-active"); //deactivate dropdown if user clicks anywhere outside of root element (class autocomplete)
    }
  });
};
