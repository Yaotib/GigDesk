# GigDesk

**AI-Powered Booking & Production Assistant for Live Music Professionals**

GigDesk is an AI-powered booking and production management platform designed to simplify how musicians and live bands manage event enquiries, prepare quotations, recommend performance lineups, and coordinate technical production requirements.

Built for **Susan Augustt & the Adorkor Band**, GigDesk transforms unstructured event enquiries from WhatsApp messages, emails, voice notes, and other communication channels into structured booking briefs, professional quotations, invoices, and venue-ready technical riders.

The platform combines AI-assisted information extraction with deterministic business rules and human approval to make the booking process faster, more consistent, and reliable.

---

## The Problem

Managing live music bookings involves more than simply receiving an event request and confirming a performance.

Booking teams often have to:

- Interpret informal enquiries received through WhatsApp, emails, and voice notes.
- Identify missing or unclear event information.
- Follow up with clients to clarify booking requirements.
- Determine the most suitable band lineup for an event.
- Calculate performance fees, additional expenses, and applicable charges.
- Prepare professional quotations and invoices.
- Communicate technical requirements to event organisers and venue production teams.

These tasks are often handled manually across different communication channels and documents. This creates unnecessary administrative work, increases the possibility of errors, and makes it difficult to maintain consistency across bookings.

**GigDesk addresses this problem by bringing the booking and production preparation workflow into one organised platform.**

## Our Solution

GigDesk provides a central workspace where a booking team can move from an initial client enquiry to production-ready documents through a structured workflow.

Instead of manually interpreting every message and preparing documents from scratch, the team can use AI to extract relevant information, identify gaps, and prepare recommendations.

A deterministic pricing engine handles financial calculations, while the booking team retains control over decisions and final approvals.

### Core Features

#### 1. Intelligent Enquiry Processing

Convert unstructured event enquiries into structured booking information.

- Paste WhatsApp messages, emails, or booking notes.
- Upload or provide voice recordings for transcription.
- Extract important event details using AI.
- Identify missing, uncertain, and confirmed information.
- Display source excerpts so users can verify extracted details.
- Generate suggested clarification messages for clients.

#### 2. AI-Assisted Brief Analysis

GigDesk analyses incoming enquiries and organises the information into meaningful categories.

Extracted information may include:

- Client and contact details.
- Event name and type.
- Event date and location.
- Performance start and end times.
- Expected audience size.
- Venue information.
- Budget and special requests.
- Sound and production requirements.

Information is classified as **Found**, **Uncertain**, or **Missing**, allowing the booking team to identify what needs attention before preparing a quotation.

The team can edit extracted information, confirm details, and incorporate new information received from clients.

#### 3. Intelligent Lineup Recommendations

Different events require different performance arrangements.

GigDesk supports three configurable performance lineups:

- **2-Piece:** A smaller performance configuration.
- **4-Piece:** A medium-sized band arrangement.
- **11-Piece:** A full band production.

The recommendation engine evaluates event requirements against configurable lineup characteristics and suitability rules.

Users can compare:

- Lineup composition.
- Performance costs.
- Budget suitability.
- Stage and equipment requirements.
- Setup considerations.
- Advantages and trade-offs.

Recommendations are explainable, and the booking team can override them when necessary.

#### 4. Rule-Based Pricing Engine

GigDesk uses a deterministic TypeScript pricing engine to calculate quotations.

Unlike AI-generated financial estimates, the pricing engine applies explicit business rules and configurable pricing information.

It supports:

- Performance fees.
- Additional musicians and services.
- Transportation and location-related costs.
- Accommodation and other applicable expenses.
- Configurable taxes and charges.
- Deposits and outstanding balances.
- Additional manually entered quotation items.

Every calculation follows defined rules, making financial results consistent, testable, and reproducible.

**AI does not determine prices or calculate financial totals.**

#### 5. Professional Quotation and Invoice Generation

Once the booking details and pricing have been reviewed, GigDesk allows the team to prepare professional client-facing documents.

Generated documents can include:

- Itemised quotation.
- Performance and service descriptions.
- Additional expenses.
- Subtotals and applicable charges.
- Deposit requirements.
- Outstanding balances.
- Payment information.
- Relevant booking terms and conditions.

The booking team must review and approve a quotation before exporting the final document.

#### 6. Venue-Ready Technical Riders

GigDesk also prepares technical production documents for event organisers and venue teams.

A technical rider can include:

- Stage plot.
- Audio input list.
- Microphone and instrument requirements.
- Monitor requirements.
- Power requirements.
- Backline and equipment requirements.
- Setup and soundcheck considerations.
- Production notes.

This helps communicate the band's technical requirements clearly before an event takes place.

#### 7. Centralised Booking Dashboard

The dashboard provides an overview of the booking workflow.

It is designed to help the team monitor:

- Incoming enquiries.
- Bookings in progress.
- Missing client information.
- Pending quotation approvals.
- Upcoming events.
- Recent booking activity.

The goal is to provide a clear operational overview without requiring the team to navigate multiple disconnected tools.

#### 8. Configurable Business Settings

GigDesk supports configurable business information and pricing rules.

Settings may include:

- Band lineup configurations.
- Performance rates.
- Transportation charges.
- Accommodation costs.
- Rehearsal and production fees.
- Tax settings.
- Deposit requirements.
- Payment details.
- Booking terms and conditions.
- Business branding.

Sample pricing values are clearly identified as sample data and should be replaced with verified business information before real-world use.

---

## How It Works

GigDesk follows a structured workflow:

1. **Receive an enquiry:** The booking team pastes a WhatsApp message, email, booking note, or voice recording.
2. **Analyse the enquiry:** AI extracts event information and identifies missing or uncertain details.
3. **Clarify requirements:** The team reviews the extracted information and sends suggested clarification messages when necessary.
4. **Update the booking brief:** New client responses are incorporated into the event information.
5. **Compare lineups:** The recommendation engine evaluates the available band configurations.
6. **Generate a quotation:** The deterministic pricing engine calculates the applicable charges.
7. **Review and approve:** A team member verifies the information, pricing, and quotation before approval.
8. **Export documents:** GigDesk generates the client quotation or invoice and the venue technical rider.

The objective is to reduce the time and administrative effort required to move from an initial enquiry to professional booking documentation.

---

## AI and Business Logic

GigDesk is designed around a clear separation between AI-assisted tasks and deterministic business operations.

| Responsibility | Approach |
|---|---|
| Voice transcription | Speech-to-text |
| Enquiry understanding | AI |
| Information extraction | AI with structured output |
| Missing information detection | Application validation and AI assistance |
| Clarification message drafting | AI |
| Lineup recommendations | Deterministic rules engine |
| Pricing calculations | Deterministic rules engine |
| Tax and deposit calculations | Deterministic rules engine |
| Document generation | Application logic |
| Final approval | Human decision |

### Why This Approach?

AI is useful for understanding unstructured human communication, but it should not be trusted to invent business information or perform financial calculations without verification.

GigDesk therefore uses AI where language understanding is valuable and deterministic code where accuracy, consistency, and accountability are essential.

The system is designed with human oversight at important decision points.

**GigDesk does not automatically send messages, approve quotations, or invent missing booking information.**

---

## Technology Stack

The proposed technology stack for the MVP includes:

| Technology | Purpose |
|---|---|
| Next.js | Application framework |
| React | User interface |
| TypeScript | Application logic and type safety |
| Tailwind CSS | Styling and responsive layouts |
| shadcn/ui | Reusable interface components |
| Lucide React | Interface icons |
| Supabase / SQLite | Data persistence |
| LLM API | Enquiry understanding and structured extraction |
| Speech-to-text API | Voice transcription |
| TypeScript Rules Engine | Pricing and lineup calculations |
| React PDF / HTML-to-PDF | Document generation |
| Vercel | Application deployment |

The final implementation may adjust individual technologies based on development requirements.

---

## Design Principles

GigDesk is being designed around the following principles:

- **Simplicity:** Make complex booking operations straightforward.
- **Accuracy:** Keep financial calculations deterministic and testable.
- **Transparency:** Show where extracted information comes from and identify uncertainty.
- **Human Control:** Require team review and approval before important outputs are finalised.
- **Efficiency:** Reduce repetitive administrative work.
- **Accessibility:** Provide a responsive experience across desktop, tablet, and mobile devices.
- **Local Relevance:** Account for the realities of operating a live music business in Ghana, including WhatsApp-based communication, Ghana cedi pricing, transportation, and Mobile Money payment information.

---

## Target Users

GigDesk is primarily designed for:

- Band managers.
- Booking coordinators.
- Musicians and band leaders.
- Event production coordinators.
- Live music businesses.

Although the initial implementation is tailored to Susan Augustt & the Adorkor Band, the underlying concept can be adapted for other bands and independent live music professionals.

---

## Project Goals

The MVP aims to demonstrate that GigDesk can:

- Extract at least 90% of relevant information from a test set of 15–20 event briefs.
- Produce mathematically accurate quotations through deterministic calculations.
- Generate professional client-facing and venue-facing documents.
- Reduce the time required to process an enquiry and prepare documents.
- Provide transparent AI recommendations with human oversight.
- Deliver a complete demonstration workflow from enquiry intake to document export in under three minutes.

These are project targets to be evaluated during development and testing, not claims of already achieved performance.

---

## Privacy and Data Protection

GigDesk is designed with privacy and responsible data handling in mind.

Key considerations include:

- Collecting only information necessary for booking operations.
- Handling client information responsibly.
- Providing a way to delete enquiries and associated information.
- Respecting applicable data protection requirements, including Ghana's Data Protection Act.
- Avoiding the use of client data for model training.
- Maintaining human oversight over AI-generated information and recommendations.

---

## Project Status

GigDesk is being developed as a hackathon MVP.

The initial scope focuses on demonstrating the complete booking workflow, from unstructured enquiry processing to quotation and technical rider generation.

Features, integrations, and business rules may evolve as the project is tested and refined.

---

## Future Possibilities

Beyond the MVP, GigDesk could evolve into a broader management platform for live music professionals.

Potential future improvements include:

- Calendar and performance scheduling integrations.
- Client and booking history management.
- Automated booking reminders.
- Digital contract generation and signing.
- Payment tracking and reconciliation.
- Multiple band and artist profiles.
- Advanced production planning.
- Analytics for booking performance and revenue.
- Integrations with WhatsApp Business and other communication platforms.

---

## Contributing

Contributions, feedback, and suggestions are welcome.

If you are interested in improving GigDesk:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your implementation.
5. Submit a pull request describing your changes.

Please ensure that business rules and financial calculations are covered by appropriate tests.

---

## License

The project's license and usage permissions will be specified in the repository.

---

**GigDesk**

*From the first enquiry to the final stage plan, one organised workflow.*

