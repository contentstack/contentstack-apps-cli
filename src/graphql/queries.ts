import { gql, DocumentNode } from "@contentstack/cli-launch";

const projectsQuery: DocumentNode = gql`
  query Projects($query: QueryProjectsInput!) {
    projects: Projects(query: $query) {
      edges {
        node {
          uid
          name
          integrations {
            developerHubApp {
              uid
            }
          }
          latestDeploymentStatus {
            deployment {
              url
            }
            environment {
              uid
            }
          }
        }
      }
    }
  }
`;

export { projectsQuery };
