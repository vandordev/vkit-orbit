import { readFileSync } from "node:fs";
import { parseAllDocuments, visit, isAlias, isScalar } from "yaml";
import { validateConfigDocument, type RawConfigDocument } from "./document";
import { configError } from "./errors";

export function loadConfigDocument(filePath: string, runtime = "structure"): RawConfigDocument {
	const diagnostic = { filePath, runtime };
	let source: string;
	try { source = readFileSync(filePath, "utf8"); } catch { throw configError(diagnostic, [], "cannot read document"); }
	const documents = parseAllDocuments(source, { version: "1.2", uniqueKeys: true, stringKeys: true, strict: true });
	const document = documents[0];
	if (documents.length !== 1 || !document || document.errors.length || document.warnings.length || document.directives?.yaml.version !== "1.2") throw configError(diagnostic, [], "invalid YAML 1.2 document");
	visit(document, (_key, node) => {
		if (isAlias(node) || (node && typeof node === "object" && (("anchor" in node && node.anchor) || ("tag" in node && node.tag)))) throw configError(diagnostic, [], "aliases, anchors and explicit tags are forbidden");
		if (_key === "key" && isScalar(node) && node.value === "<<") throw configError(diagnostic, [], "merge keys are forbidden");
	});
	return validateConfigDocument(document.toJS({ maxAliasCount: 0 }), diagnostic);
}
