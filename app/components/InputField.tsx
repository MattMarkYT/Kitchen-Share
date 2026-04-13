import React from "react";

type FormInputProps = {
    label: string;
    error?: string;
    optional?: boolean;
    fieldType?: "textS" | "textL" | "selection";
    selectOptions?: string[];
} & React.InputHTMLAttributes<HTMLInputElement>
    & React.TextareaHTMLAttributes<HTMLTextAreaElement>
    & React.SelectHTMLAttributes<HTMLSelectElement>

export default function InputField({
                                        label,
                                        error,
                                        optional = false,
                                        fieldType = "textS",
                                        selectOptions,
                                        ...inputProps
                                  }: FormInputProps) {

    const fieldStyle = "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition"
    + "placeholder:text-gray-400 focus:ring-2";

    const regularColor = "border-gray-300 focus:border-gray-400 focus:ring-gray-200";
    const errorColor = "border-red-500 focus:ring-red-200";

    return (
        <div className="flex flex-col gap-1 pb-5">
            <label className="text-base font-medium text-gray-900">
                {label}
                {optional && <span className="text-slate-400"> (optional)</span>}
            </label>

            {(fieldType == "textS") ?
                <input
                    {...inputProps}
                    className={`${fieldStyle}
                    ${
                        error
                            ? errorColor
                            : regularColor
                    }`}/>
            : fieldType == "textL" ?
                <textarea
                    {...inputProps}
                    className={`${fieldStyle}
                    ${
                        error
                            ? errorColor
                            : regularColor
                    }`}/>
            : fieldType == "selection" ?
                <select
                    {...inputProps}
                    className={`${fieldStyle}
                    ${
                        error
                            ? errorColor
                            : regularColor
                    }`}>
                    <option value="">Select a category</option>
                    {selectOptions == undefined ? null : selectOptions.map(c => <option key={c} value={c}>{c}</option>)}

                </select>
            : null}

            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}