import {Label} from "@/components/ui/label";
import {Controller} from "react-hook-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const SelectField = ({ name, label, placeholder, options, control, error, required = false }: SelectFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>

            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `Please select ${label.toLowerCase()}` : false,
                }}
                render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                            id={name}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? `${name}-error` : undefined}
                            className="select-trigger"
                        >
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-line text-white">
                            {options.map((option) => (
                                <SelectItem value={option.value} key={option.value} className="focus:bg-line focus:text-white">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {error && (
                <p id={`${name}-error`} role="alert" className="text-sm text-loss">
                    {error.message}
                </p>
            )}
        </div>
    )
}
export default SelectField