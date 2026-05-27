export const SYSTEM_PROMPT = `You are SpecBot, an expert AI assistant specialized in 3GPP telecommunications standards and wireless testing.

You have deep knowledge of:
- 3GPP specifications (LTE, 5G NR, 6G research)
- Wireless protocols: RRC, PDCP, RLC, MAC, PHY layers
- Test and measurement: R&S (CMW, CMX, FSW, SMW) and Keysight (UXM, PXA, MXA) instruments
- Conformance and performance testing methodologies
- RF measurements: EVM, ACLR, sensitivity, throughput, reference sensitivity

Your strict behavior rules:
- Answer ONLY based on the retrieved specification sections provided in the context
- Always cite the spec document name and page/section reference in your answer
- If the answer is not in the provided context, respond: "This requirement is not covered in the uploaded spec sections. Please upload the relevant 3GPP document (e.g., TS 38.101-1 for 5G NR UE radio)."
- Use precise technical language appropriate for RF test engineers
- Never guess, infer, or hallucinate specification values, thresholds, or requirements
- Format responses clearly with bullet points or numbered lists when listing requirements`;

export function buildQueryPrompt(
  query: string,
  context: string,
  specName: string
): string {
  return `Retrieved specification context from: ${specName}
═══════════════════════════════════════════════════
${context}
═══════════════════════════════════════════════════

RF Test Engineer's Question:
${query}

Instructions:
- Answer based strictly on the specification context above
- Quote exact parameter values, thresholds, and table references where available
- Reference the page numbers visible in the context
- Be technically precise and use proper 3GPP terminology`;
}

export function buildTestCasePrompt(
  scenario: string,
  context: string,
  specName: string,
  tcId: string
): string {
  return `Retrieved specification requirement from: ${specName}
═══════════════════════════════════════════════════
${context}
═══════════════════════════════════════════════════

Task: Generate a complete, structured test case for this scenario:
"${scenario}"

Output in this EXACT format (fill all fields based on spec context above):

TEST CASE ID     : ${tcId}
TITLE            : [Short descriptive title — max 10 words]
SPEC REFERENCE   : ${specName}
OBJECTIVE        : [One sentence: what conformance requirement this verifies]
CATEGORY         : [Conformance / Performance / Interoperability]

PRE-CONDITIONS:
  - UE Category  : [Device class/category requirements]
  - Test Mode    : [Conducted / Radiated / OTA]
  - Equipment    : [Specific R&S or Keysight instrument + model]
  - Band/Channel : [Frequency band, channel BW, center frequency]
  - Network Mode : [Test network configuration, EARFCN/NR-ARFCN]

TEST STEPS:
  1. [Configure test equipment: instrument settings, attenuation, power levels]
  2. [Set UE in test mode: test mode activation, band selection]
  3. [Apply test signal/conditions as per spec]
  4. [Trigger measurement]
  5. [Record results]
  6. [Repeat for all required channel configurations if applicable]

MEASUREMENT:
  - Parameter    : [What RF parameter is being measured]
  - Method       : [Direct / Comparative / Statistical]
  - Instrument   : [Specific R&S or Keysight tool + measurement function]
  - Sample Count : [Number of samples/averages required]

PASS CRITERIA:
  - [Exact numeric threshold from spec — include units]
  - Reference    : ${specName}, Table/Section [X.X.X]

FAIL CRITERIA:
  - [What constitutes a failure — threshold violation description]

NOTES:
  - [Edge cases, exceptions, test tolerances, or spec deviations]
  - [Any applicable 3GPP release dependencies]`;
}
