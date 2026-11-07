# Official LangGraph generation run

This directory contains the official Sprint 03 Java generation results. The four Gemini requests were invoked from the LangGraph node generate_java, in order EC-C02, EC-C04, EC-C01, EC-C05. Each candidate has a JSON prompt, structured response/usage metadata, and Java source. Repair prompts/responses use .repair-1 and .repair-2 suffixes.

The sibling generation/ root contains an earlier superseded direct Gemini invocation whose LLM calls were outside LangGraph. Those files are preserved for research audit but excluded from official final-source and candidate pass metrics.

The corresponding Maven sources are under experiments/expresscart/bewt-suite/src/test/java/tests/. Secrets are not recorded.
