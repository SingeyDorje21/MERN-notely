import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui class-name helper: merges conditional classes and resolves Tailwind conflicts
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// "just now", "5 minutes ago", "yesterday"... falls back to a date after ~4 weeks
export function formatRelativeTime(value) {
    const date = new Date(value);
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const abs = Math.abs(diffSeconds);
    if (abs < 45) return "just now";

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
    if (abs < 604800) return rtf.format(Math.round(diffSeconds / 86400), "day");
    if (abs < 2419200) return rtf.format(Math.round(diffSeconds / 604800), "week");
    return formatDate(date);
}

// DOMParser builds an inert document, so note HTML never executes while we read it
const parseHtml = (html) => new DOMParser().parseFromString(html || "", "text/html");

export function htmlToText(html) {
    if (!html) return "";
    // Pad block boundaries so "<p>a</p><p>b</p>" reads "a b", not "ab"
    const spaced = html.replace(/<\/(p|h[1-6]|li|blockquote|pre|div)>|<br\s*\/?>/gi, "$& ");
    return (parseHtml(spaced).body.textContent || "").replace(/\s+/g, " ").trim();
}

export const isContentEmpty = (html) => htmlToText(html) === "";

export const countWords = (text) => (text ? text.split(/\s+/).length : 0);

export function htmlToMarkdown(html) {
    const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE) return "";
        const inner = () => Array.from(node.childNodes).map(walk).join("");

        switch (node.tagName) {
            case "H1": return `# ${inner()}\n\n`;
            case "H2": return `## ${inner()}\n\n`;
            case "H3": return `### ${inner()}\n\n`;
            case "P": return `${inner()}\n\n`;
            case "STRONG":
            case "B": return `**${inner()}**`;
            case "EM":
            case "I": return `_${inner()}_`;
            case "S": return `~~${inner()}~~`;
            case "CODE": return node.parentElement?.tagName === "PRE" ? inner() : `\`${inner()}\``;
            case "PRE": return `\`\`\`\n${node.textContent}\n\`\`\`\n\n`;
            case "BLOCKQUOTE":
                return inner().trim().split("\n").map((line) => `> ${line}`).join("\n") + "\n\n";
            case "UL":
            case "OL":
                return Array.from(node.children)
                    .map((li, i) => `${node.tagName === "OL" ? `${i + 1}.` : "-"} ${walk(li).trim()}`)
                    .join("\n") + "\n\n";
            case "HR": return "---\n\n";
            case "BR": return "\n";
            default: return inner();
        }
    };
    return walk(parseHtml(html).body).replace(/\n{3,}/g, "\n\n").trim();
}

export function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function downloadFile(filename, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
