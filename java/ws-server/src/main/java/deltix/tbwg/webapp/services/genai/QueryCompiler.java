package deltix.tbwg.webapp.services.genai;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import deltix.qsrv.hf.tickdb.comm.client.TickDBClient;
import deltix.tbwg.webapp.services.timebase.TimebaseService;
import deltix.tbwg.webapp.settings.AiApiSettings;
import deltix.util.parsers.CompilationException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
@ConditionalOnBean(AiApiSettings.class)
public class QueryCompiler {
    private static final Log LOG = LogFactory.getLog(QueryCompiler.class);
    private final TimebaseService timebaseService;

    public QueryCompiler(TimebaseService timebaseService) {
        this.timebaseService = timebaseService;
    }

    public String compile(String query) {
        if (query == null || query.isBlank()) return "Empty query";
        try {
            TickDBClient tb = (TickDBClient) timebaseService.getConnection();
            tb.compileQuery(query, new ArrayList<>());
            return "";
        } catch (CompilationException ce) {
            LOG.warn("Compile fail: %s").with(ce.getMessage());
            return ce.getMessage();
        } catch (Throwable t) {
            LOG.warn("Unexpected compile error: %s").with(t.toString());
            return "Internal compiler error";
        }
    }
}