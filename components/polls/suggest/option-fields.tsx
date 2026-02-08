// [COMMENTED OUT] 여론조사 기능 비활성화 - OptionFields 컴포넌트 (여론조사 선택지 입력 필드)
// "use client";
//
// import { useFieldArray, useFormContext } from "react-hook-form";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import type { CreatePollFormValues } from "@/lib/validations/poll";
//
// export function OptionFields() {
//   const {
//     register,
//     formState: { errors },
//   } = useFormContext<CreatePollFormValues>();
//
//   const { fields, append, remove } = useFieldArray<CreatePollFormValues>({
//     name: "options",
//   });
//
//   return (
//     <div className="space-y-3">
//       <div className="flex items-center justify-between">
//         <Label>선택지</Label>
//         <span className="text-xs text-muted-foreground">{fields.length}/10</span>
//       </div>
//
//       <div className="space-y-2">
//         {fields.map((field, index) => (
//           <div key={field.id} className="flex gap-2">
//             <div className="flex-1">
//               <Input placeholder={`선택지 ${index + 1}`} {...register(`options.${index}.text`)} />
//               {errors.options?.[index]?.text && (
//                 <p className="mt-1 text-sm text-destructive">
//                   {errors.options[index]?.text?.message}
//                 </p>
//               )}
//             </div>
//             {fields.length > 2 && (
//               <Button type="button" variant="outline" size="icon" onClick={() => remove(index)}>
//                 ✕
//               </Button>
//             )}
//           </div>
//         ))}
//       </div>
//
//       {fields.length < 10 && (
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           onClick={() => append({ text: "" })}
//           className="w-full"
//         >
//           + 선택지 추가
//         </Button>
//       )}
//
//       {errors.options && !Array.isArray(errors.options) && (
//         <p className="text-sm text-destructive">{errors.options.message}</p>
//       )}
//     </div>
//   );
// }

 
export function OptionFields() {
  return null;
}
