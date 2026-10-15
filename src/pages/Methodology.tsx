import { BookOpen, CheckCircle2, Database, ExternalLink, Leaf } from "lucide-react";
import { Card, PageHeader } from "../components/ui";

export default function Methodology() {
  return (
    <div className="page methodology">
      <PageHeader
        eyebrow="Transparency & provenance"
        title="Methodology"
        description="How AirScope sources, validates, indexes in Neo4j Graph Database, and interprets air-quality data."
      />
      <div className="method-grid">
        <Card className="span-2" title="Current dataset status">
          <div className="dataset-status">
            <span><Database size={22} /></span>
            <div>
              <strong style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2dd4bf" }}>
                <CheckCircle2 size={16} /> Live Neo4j Aura Connected
              </strong>
              <p>
                This production deployment is connected to Neo4j Aura Cloud, storing <strong>88,340 hourly environmental observations</strong> structured as a property graph across 10 major metropolitan monitoring hubs (Ahmedabad, Bengaluru, Chennai, Delhi, Hyderabad, Kolkata, Lucknow, Mumbai, Patna, Pune) covering the complete 2024 calendar year.
              </p>
            </div>
          </div>
        </Card>
        <Card title="Source standards" subtitle="CPCB Compliance">
          <div className="method-content">
            <BookOpen size={22} />
            <h3>Central Pollution Control Board</h3>
            <p>
              Data structures follow National Ambient Air Quality Standards (NAAQS) including particulate matter (PM2.5, PM10) and gaseous pollutants (NO₂, SO₂, CO, O₃).
            </p>
            <a href="https://cpcb.nic.in/" target="_blank" rel="noreferrer">
              Visit CPCB <ExternalLink size={14} />
            </a>
          </div>
        </Card>
        <Card title="AQI interpretation" subtitle="Indian National AQI">
          <div className="method-content">
            <Leaf size={22} />
            <h3>Pollutant sub-indices</h3>
            <p>
              Indian National AQI categories: Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401-500).
            </p>
          </div>
        </Card>
      </div>
      <Card title="Data processing architecture">
        <div className="policy-grid">
          <div>
            <span>01</span>
            <strong>Property Graph Modeling</strong>
            <p>Neo4j labeled nodes and temporal graph edges enable expressive, millisecond Cypher queries.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Hourly Aggregation</strong>
            <p>88k raw readings are compiled into daily and annual benchmarks without precision loss.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Serverless APIs</strong>
            <p>Vercel Edge & Serverless functions securely query Neo4j Aura using connection pooling via neo4j-driver.</p>
          </div>
          <div>
            <span>04</span>
            <strong>Missing Value Imputation</strong>
            <p>Missing sensor readings remain null and do not distort arithmetic averages.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
