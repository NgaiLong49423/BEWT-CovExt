# T01-A — Java Compiler Compatibility Decision

## Question and verification

`experiments/expresscart/bewt-suite/pom.xml` declares `maven.compiler.source/target=21`, but directly configures `maven-compiler-plugin` 3.7.0 with `source/target=1.8`.

- Environment: Apache Maven 3.9.16, Java 21.0.12.
- Command: `mvn -f experiments/expresscart/bewt-suite/pom.xml help:effective-pom -Doutput=<temporary-file> -q`.
- The effective POM has plugin-level `source=1.8` and `target=1.8` and repeats these in `default-compile` and `default-testCompile`; explicit plugin configuration wins for both executions.
- The sandbox invocation initially could not read Maven's user cache (`AccessDeniedException` on `.m2/.../resolver-status.properties`). The same effective-POM query succeeded via permitted execution. Captured output: `evidence/maven-effective-compiler-plugin.xml`.
- T01-A did not run `mvn test-compile` or inventory every Java language feature. The effective configuration proves the selected language/bytecode level, not that the project build fails.

## Decision

**Do not edit the POM in T01-A.** No compile failure caused by the mismatch or Java 21 syntax requirement is demonstrated. Preserve the pilot and record the compatibility risk. Before T01-B uses the suite, Team Lead should choose either to preserve Java 8 compatibility and correct misleading Java 21 properties/documentation, or align the compiler configuration to 21 (prefer reviewed `maven.compiler.release=21`) and rerun the relevant compile/tests. Do not infer that editing only a property changes effective behavior.
