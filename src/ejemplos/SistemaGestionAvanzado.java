public class SistemaGestionAvanzado {
    public static void main(String[] args) { 
        // Nivel avanzado: lógica compleja con múltiples tipos de datos
        String nombre = "Sistema Avanzado";
        int edad = 25;
        double salario = 50000.75;
        char categoria = 'A';
        boolean activo = true;
        
        // Variables para cálculos complejos
        double bonus = 0.0;
        double salarioFinal = 0.0;
        int diasTrabajados = 250;
        double tasaImpuesto = 0.15;
        int totalProyectos = 5;
        double productividad = 0.0;
        
        // Estructuras condicionales anidadas profundas
        if (edad >= 18) {
            if (salario > 40000.0) {
                if (diasTrabajados >= 240) {
                    bonus = salario * 0.10;
                    if (totalProyectos > 3) {
                        bonus = bonus + salario * 0.05;
                    } else {
                        bonus = bonus + salario * 0.02;
                    }
                } else {
                    bonus = salario * 0.05;
                }
            } else {
                bonus = salario * 0.03;
            }
        } else {
            bonus = 0.0;
        }
        
        // Cálculos con operadores
        salarioFinal = salario + bonus;
        double impuesto = salarioFinal * tasaImpuesto;
        double salarioNeto = salarioFinal - impuesto;

        // Mostrar resultados
        System.out.println("Salario Neto: " + salarioNeto);
        // Comparaciones complejas
        boolean recibeBono = bonus > 0.0;
        boolean esContratado = activo != false;
        
        // Bucle for con cálculos acumulativos y anidación
        int sumaAnios = 0;
        for (int anio = 2020; anio <= 2024; anio++) {
            sumaAnios = sumaAnios + anio;
            System.out.println(anio);
            
            for (int trimestre = 1; trimestre <= 2; trimestre++) {
                int gananciaTrimestral = anio * trimestre;
                System.out.println(gananciaTrimestral);
            }
        }
        
        // Bucle while con bucle for anidado
        int mes = 1;
        while (mes <= 4) {
            int diasMes = 30;
            
            if (mes == 2) {
                diasMes = 28;
            } else {
                if (mes == 4) {
                    diasMes = 30;
                } else {
                    diasMes = 31;
                }
            }
            
            System.out.println(diasMes);
            
            for (int semana = 1; semana <= 4; semana++) {
                int horasSemana = semana * 40;
                System.out.println(horasSemana);
            }
            
            mes++;
        }
        
        // If-else anidado para cálculo de productividad
        if (diasTrabajados > 240) {
            productividad = 0.95;
            if (totalProyectos > 5) {
                productividad = 0.98;
                if (categoria == 'A') {
                    productividad = productividad + 0.02;
                } else {
                    productividad = productividad - 0.01;
                }
            } else {
                productividad = 0.90;
            }
        } else {
            productividad = 0.80;
        }
        
        // While anidado con for
        int periodo = 1;
        while (periodo <= 2) {
            System.out.println(periodo);
            
            for (int dia = 1; dia <= 3; dia++) {
                int horasDia = dia * 8;
                System.out.println(horasDia);
                
                if (horasDia > 8) {
                    System.out.println("Horas extras");
                } else {
                    System.out.println("Horas normales");
                }
            }
            
            periodo++;
        }
        
        // Operaciones con variables y cálculos finales
        double promedioDiario = salarioNeto / diasTrabajados;
        
        // Incrementos y decrementos
        edad++;
        diasTrabajados--;
        
        // If-else final
        if (salarioNeto > 35000.0) {
            System.out.println("Salario alto");
        } else {
            System.out.println("Salario moderado");
        }
        
        // Salida final
        System.out.println(nombre);
        System.out.println(salarioNeto);
        System.out.println(promedioDiario);
    }
}
