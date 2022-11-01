import axios from "axios";

const bdl = axios.create({
  baseURL: "https://www.balldontlie.io/api/v1/",
});

const nba = axios.create({
  baseURL: "https://data.nba.net/data/10s/prod/v1/",
});

const errorHandler = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error.message);
  }
  console.log(error.config);
};

export const bdlPlayersFetch = async (query) => {
  try {
    const response = await bdl.get("/players", { params: { search: query } });
    return response.data.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const bdlPlayerFetch = async (playerID) => {
  try {
    const response = await bdl.get(`players/${playerID}`);
    return response;
  } catch (error) {
    errorHandler(error);
  }
};

export const bdlStatsFetch = async (firstYear, playerID) => {
  try {
    const response = await bdl.get(
      `season_averages?season=${firstYear}&player_ids[]=${playerID}`
    );
    return response;
  } catch (error) {
    errorHandler(error);
  }
};

export const nbaPlayersFetch = async (firstYear) => {
  try {
    const response = await nba.get(
      `https://data.nba.net/data/10s/prod/v1/${firstYear}/players.json`
    );
    return response;
  } catch (error) {
    errorHandler(error);
  }
};

export const nbaTeamsFetch = async () => {
  try {
    const response = await nba.get("2022/teams.json");
    return response;
  } catch (error) {
    errorHandler(error);
  }
};
