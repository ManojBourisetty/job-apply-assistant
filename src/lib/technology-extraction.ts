// A deterministic (non-AI) keyword scanner used to extract recognizable
// technology mentions from job descriptions and resume text. Every match is
// a literal substring found in the source text — nothing is inferred or
// guessed, which keeps it safe to use for the truth-preserving resume and
// job-matching features.
export const KNOWN_TECHNOLOGIES = [
  "AWS",
  "Amazon Web Services",
  "GCP",
  "Google Cloud",
  "Azure",
  "Kubernetes",
  "K8s",
  "Docker",
  "Terraform",
  "CloudFormation",
  "Pulumi",
  "Ansible",
  "Chef",
  "Puppet",
  "Salt",
  "GitLab",
  "GitLab CI",
  "GitHub Actions",
  "Jenkins",
  "CircleCI",
  "Travis CI",
  "ArgoCD",
  "Flux",
  "Helm",
  "Vault",
  "Consul",
  "Nomad",
  "Datadog",
  "Dynatrace",
  "Splunk",
  "Prometheus",
  "Grafana",
  "New Relic",
  "PagerDuty",
  "OpenTelemetry",
  "ELK",
  "Elasticsearch",
  "Logstash",
  "Kibana",
  "Python",
  "Bash",
  "Shell",
  "Go",
  "Golang",
  "Java",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "React",
  "Ruby",
  "Rust",
  "C++",
  "C#",
  ".NET",
  "PHP",
  "Linux",
  "Unix",
  "Windows Server",
  "RHEL",
  "Ubuntu",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "DynamoDB",
  "Cassandra",
  "Kafka",
  "RabbitMQ",
  "SQS",
  "Spark",
  "Airflow",
  "Snowflake",
  "BigQuery",
  "VPC",
  "DNS",
  "TCP/IP",
  "Load Balancing",
  "CDN",
  "Nginx",
  "Apache",
  "Istio",
  "Envoy",
  "Service Mesh",
  "Microservices",
  "REST",
  "GraphQL",
  "gRPC",
  "OAuth",
  "SAML",
  "SSO",
  "IAM",
  "SOC 2",
  "HIPAA",
  "FedRAMP",
  "PCI DSS",
];

const TECH_REGEXES = KNOWN_TECHNOLOGIES.map(
  (tech) => [tech, new RegExp(`(?<![\\w.])${escapeRegExp(tech)}(?![\\w])`, "i")] as const
);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractTechnologies(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const [tech, regex] of TECH_REGEXES) {
    if (regex.test(text)) found.add(tech);
  }
  return Array.from(found);
}
