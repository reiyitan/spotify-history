import { useState, useEffect, Dispatch, SetStateAction } from "react";
import './App.css'

interface ListenEventDto {
  title: string;
  artist: string;
  url: string;
  timestamp: string;
}

interface ListenEventViewModel {
  title: string;
  artist: string;
  numListens: number;
  url: string;
  timestamp: string;
}

interface Group<T> {
  [key: string]: T[];
}

const DateInput = ({ label, value, setValue }: { label: string, value: string, setValue: Dispatch<SetStateAction<string>> }) => {
  return (
    <div className="date-input-component-container">
      <h1>{label}</h1>
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />  
    </div>
  );
}

const NumListensInput = ({ value, setValue }: { value: number, setValue: Dispatch<SetStateAction<number>> }) => {
  return (
    <div className="num-listens-input-container">
      <h1>Number of times listened:</h1>
      <input 
        type="number"
        placeholder="0"
        min="0"
        value={Number.isNaN(value) ? "" : value.toString()}
        onChange={e => setValue(parseInt(e.target.value))}
      />
    </div>
  );
}

const Item = ({ viewModel }: { viewModel: ListenEventViewModel }) => {
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }

  return (
    <div className="data-item">
      <a href={viewModel.url}>
        {viewModel.artist} - {viewModel.title}
      </a>
      <p>You listened {viewModel.numListens} time{viewModel.numListens !== 1 ? "s" : ""}</p>
      <p>First listen: {formatTimestamp(viewModel.timestamp)}</p>
    </div>
  );
}

const App = () => {
  const [data, setData] = useState<ListenEventDto[]>([]); 
  const [dataView, setDataView] = useState<ListenEventViewModel[]>([]);
  const [startDateString, setStartDateString] = useState<string>("");
  const [endDateString, setEndDateString] = useState<string>(""); 
  const [minNumListens, setMinNumListens] = useState<number>(0);

  useEffect(() => {
    fetch("/processed-data.json")
      .then(response => response.json())
      .then(json => setData(json))
      .catch(error => console.error("Error loading JSON:", error));
  }, []);

  const groupBy = (items: ListenEventDto[], getKey: (ListenEventDto: any) => string) => {
    const grouped = items.reduce((groups, item) => {
      const key = getKey(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);    
      return groups;
    }, {} as Group<ListenEventDto>);
    return grouped;
  }

  const getElementsInTimeRange = (startDate: Date, endDate: Date) => {
    const filteredData = data.filter(e => {
      const elementDate = new Date(e.timestamp);
      return startDate < elementDate && elementDate < endDate; 
    })
    return filteredData;
  }

  const compareTimestamps = (a: ListenEventDto, b: ListenEventDto) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateA.getTime() - dateB.getTime();
  }

  const generateSortedSongs = (groups: Group<ListenEventDto>): ListenEventViewModel[] => {
    const aggregatedItems = Object.keys(groups).map(key => {
      const group = groups[key]; 
      const numListens = group.length;
      const sortedGroup = group.sort(compareTimestamps);

      const first = sortedGroup[0];

      const title = first.title;
      const artist = first.artist;
      const url = first.url;
      const timestamp = first.timestamp;
    
      return {
        title, artist, url, numListens, timestamp
      };
    });

    return aggregatedItems.sort(compareTimestamps);
  }

  const handleSubmit = () => {
    if (startDateString.length === 0 || endDateString.length === 0) return; 
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    if (startDate > endDate) return; 

    const elementsInTimeRange = getElementsInTimeRange(startDate, endDate);
    const groupedByTitleAndArtist = groupBy(elementsInTimeRange, (e) => e.url);
    const sortedSongs = generateSortedSongs(groupedByTitleAndArtist);
    const songsWithListensAboveThreshold = sortedSongs.filter(e => e.numListens >= (Number.isNaN(minNumListens) ? 0 : minNumListens));
    console.log(songsWithListensAboveThreshold.map(s => s.url));
    setDataView(songsWithListensAboveThreshold);
  }

  return (
    <div className="appContainer">
      <div className="input-container">
        <div className="date-input-wrapper">
          <DateInput 
            label="Start"
            value={startDateString}
            setValue={setStartDateString}
          />
          <DateInput 
            label="End"
            value={endDateString}
            setValue={setEndDateString}
          />
        </div>
        <NumListensInput value={minNumListens} setValue={setMinNumListens} />
        <button
          className="submit-button"
          onClick={handleSubmit}
        >
          View Listening History
        </button>
      </div>
      {
        dataView.length > 0 &&
        <div className="data-view-wrapper">
          <h1>({dataView.length} result{dataView.length !== 1 ? "s" : ""})</h1>
          <div className="data-items-container">
            {dataView.map(e => <Item viewModel={e} key={e.url} />)}
          </div>
        </div>
      }
    </div>
  );
}

export default App
