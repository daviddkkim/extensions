import {
  ActionPanel,
  CopyToClipboardAction,
  List,
  OpenInBrowserAction,
  ImageMask,
  getPreferenceValues,
  Icon
} from "@raycast/api";
import { useState, useEffect } from "react";
import fetch from "node-fetch";

const prefs: { instance: string; user: string; token: string } = getPreferenceValues();
export const confluenceUrl = `https://${prefs.instance}`;

const headers = {
  Accept: "application/json",
  Authorization: "Basic " + Buffer.from(`${prefs.user}:${prefs.token}`).toString("base64")
};

const init = {
  headers
};

export default function Command() {
  const [results, setResults] = useState<SearchResult[]>([
    {
      id: "",
      name: "",
      url: "",
      type: "",
      author: "",
      icon: ""
    }
  ]);

  useEffect(() => {
    searchConfluence().then((results: SearchResult[]) => setResults(results));
  }, []);

  const loadingState = results[0].id.length > 0 ? false : true;

  return (
    <List isLoading={loadingState} searchBarPlaceholder="Search by name..." throttle>
      <List.Section title="Results">
        {results.map(searchResult => (
          <SearchListItem key={searchResult.id} searchResult={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

async function searchConfluence() {
  const apiUrl = `${confluenceUrl}/wiki/rest/api/content?expand=version`;
  const response = await fetch(apiUrl, init);

  if (!response.ok) {
    return Promise.reject(response.statusText);
  }

  const json = (await response.json()) as Response;
  const jsonResults = (json?.results as ResultsItem[]) ?? [];
  return await jsonResults.map((jsonResult: ResultsItem) => {
    return {
      id: jsonResult.id as string,
      name: jsonResult.title as string,
      type: jsonResult.type as string,
      url: jsonResult._links.webui as string,
      author: jsonResult.version.by.displayName as string,
      icon: jsonResult.version.by.profilePicture.path as string
    };
  });
}

function SearchListItem({ searchResult }: { searchResult: SearchResult }) {
  return (
    <List.Item
      title={searchResult.name}
      subtitle={searchResult.type}
      keywords={[searchResult.name, searchResult.type]}
      accessoryTitle={searchResult.author}
      accessoryIcon={{ source: `${confluenceUrl}${searchResult.icon}`, mask: ImageMask.Circle }}
      icon={Icon.Document}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <OpenInBrowserAction title="Open in Browser" url={confluenceUrl + "/wiki" + searchResult.url} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <CopyToClipboardAction
              title="Copy URL"
              content={confluenceUrl + "/wiki" + searchResult.url}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  url: string;
  author: string;
  icon: string;
}

interface Response {
  results: ResultsItem[];
  start: number;
  limit: number;
  size: number;
  _links: _links;
}
interface ResultsItem {
  id: string;
  type: string;
  status: string;
  title: string;
  version: Version;
  macroRenderedOutput: Record<string, unknown>;
  extensions: Extensions;
  _expandable: _expandable;
  _links: _links;
}
interface Version {
  by: By;
  when: string;
  friendlyWhen: string;
  message: string;
  number: number;
  minorEdit: boolean;
  syncRev?: string;
  syncRevSource?: string;
  confRev: string;
  contentTypeModified: boolean;
  _expandable: _expandable;
  _links: _links;
}
interface By {
  type: string;
  accountId: string;
  accountType: string;
  email: string;
  publicName: string;
  timeZone: string;
  profilePicture: ProfilePicture;
  displayName: string;
  isExternalCollaborator: boolean;
  _expandable: _expandable;
  _links: _links;
}
interface ProfilePicture {
  path: string;
  width: number;
  height: number;
  isDefault: boolean;
}
interface _expandable {
  operations?: string;
  personalSpace?: string;
  collaborators?: string;
  content?: string;
  childTypes?: string;
  container?: string;
  metadata?: string;
  schedulePublishDate?: string;
  children?: string;
  restrictions?: string;
  history?: string;
  ancestors?: string;
  body?: string;
  descendants?: string;
  space?: string;
}
interface _links {
  self: string;
  tinyui?: string;
  editui?: string;
  webui?: string;
  base?: string;
  context?: string;
}

interface Extensions {
  position: number;
}