const fs = require("fs"); 
const path = require("path");

const getDataDirectoryPath = () => path.join(__dirname, "data"); 
const createFullPath = (name) => path.join(getDataDirectoryPath(), name);
const createOutputPath = () => path.join(__dirname, "processed-data.json");

const loadJsonFile = (path) => {
    const fileContent = fs.readFileSync(path, "utf8");
    return JSON.parse(fileContent);
}

const loadJsonFiles = (path) => {
    const fileNames = fs.readdirSync(path); 
    const jsonFileNames = fileNames
        .filter(f => f.includes(".json"))
        .map(createFullPath);
    return jsonFileNames.map(loadJsonFile);
}

const extractRelevantFields = (object) => {
    return {
        timestamp: object.ts,
        title: object.master_metadata_track_name,
        artist: object.master_metadata_album_artist_name,
        url: object.spotify_track_uri
    };
}

const writeObjectToFile = (data) => {
    const outputPath = createOutputPath();
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
}

const main = () => {
    const path = getDataDirectoryPath();
    const jsonData = loadJsonFiles(path);
    const flattenedData = jsonData.flat();
    const mappedData = flattenedData.map(extractRelevantFields);
    const nonNullData = mappedData.filter(d => d.url !== null);
    writeObjectToFile(nonNullData); 
}

main(); 