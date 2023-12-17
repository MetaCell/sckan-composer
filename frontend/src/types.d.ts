/*
 Types for the generic dropdown component
 */

type OptionDetail = {
    title: string; // What to display as the title/label for the property.
    value: string; // The actual value/content for the property.
};

export type Option = {
    id: string;
    label: string;
    group: string;
    content: OptionDetail[];
};