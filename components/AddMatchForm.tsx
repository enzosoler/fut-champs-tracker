"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";

type FormInputs = {
  goals_for: number;
  goals_against: number;
  notes: string;
};

export default function AddMatchForm() {
  const router = useRouter();
  const [result, setResult] = useState<"W" | "L">("W");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({ defaultValues: { goals_for: 0, goals_against: 0 } });

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("matches").insert([
      {
        result,
        goals_for: Number(data.goals_for),
        goals_against: Number(data.goals_against),
        notes: data.notes || null,
        user_id: user.id,
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      setSubmitError("Erro ao salvar. Tente novamente.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Win / Loss buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setResult("W")}
          className={`py-8 rounded-2xl text-xl font-bold transition-all active:scale-95 border-2 ${
            result === "W"
              ? "bg-win border-win text-white shadow-lg shadow-win/20"
              : "bg-surface border-win/30 text-win"
          }`}
        >
          ✓ VITÓRIA
        </button>
        <button
          type="button"
          onClick={() => setResult("L")}
          className={`py-8 rounded-2xl text-xl font-bold transition-all active:scale-95 border-2 ${
            result === "L"
              ? "bg-loss border-loss text-white shadow-lg shadow-loss/20"
              : "bg-surface border-loss/30 text-loss"
          }`}
        >
          ✗ DERROTA
        </button>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          {/* Score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Seus Gols
              </label>
              <input
                type="number"
                min="0"
                max="30"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:border-primary transition-colors"
                {...register("goals_for", {
                  required: true,
                  min: 0,
                  valueAsNumber: true,
                })}
              />
              {errors.goals_for && (
                <p className="text-loss text-xs mt-1">Obrigatório</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Gols do Oponente
              </label>
              <input
                type="number"
                min="0"
                max="30"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:border-primary transition-colors"
                {...register("goals_against", {
                  required: true,
                  min: 0,
                  valueAsNumber: true,
                })}
              />
              {errors.goals_against && (
                <p className="text-loss text-xs mt-1">Obrigatório</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Anotações <span className="text-gray-600">(opcional)</span>
            </label>
            <textarea
              placeholder="Lag, jogador tóxico, formação que funcionou..."
              rows={3}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <p className="text-loss text-sm text-center">{submitError}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-3.5 bg-surface border border-border rounded-xl text-gray-400 font-medium text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3.5 bg-primary text-black font-bold rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 text-sm"
        >
          {isSubmitting ? "Salvando..." : "💾  Salvar Resultado"}
        </button>
      </div>
    </form>
  );
}
